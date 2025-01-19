import {
  FeatureExtractionInput,
  FeatureExtractionOutput,
  QueueData,
  QueueStatus,
  WorkerResponseFeatureExtraction,
} from './types.ts';

class FeatureExtraction extends EventTarget {
  private worker: Worker;
  private logger: (data: any) => any;
  private queue: Array<{ id: number; texts: FeatureExtractionInput }> = [];
  private queueInProgress: boolean = false;
  private id: number = 0;

  constructor(logCallback: (data: any) => any = () => {}) {
    super();

    this.worker = new Worker(new URL('./worker.ts', import.meta.url), {
      type: 'module',
    });

    if (logCallback) {
      this.logger = logCallback;
    }
  }

  private workerMessage = (
    id: number,
    texts: FeatureExtractionInput,
    onMessage: (e: WorkerResponseFeatureExtraction) => void
  ): Promise<FeatureExtractionOutput> =>
    new Promise((resolve, reject) => {
      this.worker.postMessage({ input: texts, id, log: false });
      const listener = (e: MessageEvent<WorkerResponseFeatureExtraction>) => {
        if (e.data.id !== id) return;
        if (e.data.status === 'complete') {
          this.worker.removeEventListener('message', listener);
          resolve(e.data.output);
        }
        if (e.data.status === 'error') {
          this.worker.removeEventListener('message', listener);
          reject(e.data);
        }
        onMessage(e.data);
      };

      this.worker.addEventListener('message', listener);
    });

  private executeQueue = async () => {
    if (this.queue.length === 0) {
      this.logger('Queue is empty');
      return;
    }

    if (this.queueInProgress) {
      this.logger('Queue in progress');
      return;
    }

    this.queueInProgress = true;
    const activeElement = this.queue.shift();
    this.dispatchQueueUpdate(activeElement.id, {
      status: QueueStatus.PENDING,
      statusText: 'Pending...',
    });

    try {
      const output = await this.workerMessage(
        activeElement.id,
        activeElement.texts,
        (workerData) =>
          this.dispatchQueueUpdate(activeElement.id, {
            status: QueueStatus.PENDING,
            statusText: 'Pending...',
            workerStatus: workerData.status,
          })
      );
      this.dispatchQueueUpdate(activeElement.id, {
        status: QueueStatus.DONE,
        statusText: 'done',
        output,
      });
    } catch (e) {
      this.dispatchQueueUpdate(activeElement.id, {
        status: QueueStatus.ERROR,
        statusText: JSON.stringify(e),
      });
      this.logger(e);
    }
    this.queueInProgress = false;
    this.executeQueue();
  };

  private dispatchQueueUpdate = (id: number, data: QueueData) =>
    this.dispatchEvent(new CustomEvent(`queue-update-${id}`, { detail: data }));

  private onQueueUpdate = (
    id: number,
    cb: (data: QueueData) => void
  ): (() => void) => {
    const listener = (evt: CustomEvent<QueueData>) => cb(evt.detail);
    this.addEventListener(`queue-update-${id}`, listener as EventListener);
    return () =>
      this.removeEventListener(`queue-update-${id}`, listener as EventListener);
  };

  public generate = async (
    texts: FeatureExtractionInput,
    callback: (data: QueueData) => void = () => {}
  ): Promise<FeatureExtractionOutput> =>
    new Promise((resolve, reject) => {
      this.id++;
      const id = this.id;
      this.queue.push({ id, texts });
      callback({
        status: QueueStatus.ADDED_TO_QUEUE,
        statusText: `Added to queue at position ${this.queue.length}`,
      });
      this.executeQueue();
      const removeQueueListener = this.onQueueUpdate(id, (data) => {
        callback(data);
        if (
          data.status === QueueStatus.DONE ||
          data.status === QueueStatus.ERROR
        ) {
          removeQueueListener();
          if (data.status === QueueStatus.DONE) {
            resolve(data.output);
          } else {
            reject(data);
          }
        }
      });
    });
}

const featureExtraction = new FeatureExtraction();

export default featureExtraction;
