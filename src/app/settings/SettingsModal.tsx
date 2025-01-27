import LANGUAGES from "@brain/auditoryCortex/whisper/languages.ts";
import { Button, Form, FormElement, ShadowBoxSize } from "@theme";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";

import {
  LLM_NAMES,
  LlmProvider,
  SettingsFormValues,
} from "@utils/settings/constants.ts";
import getSetting from "@utils/settings/getSetting.ts";
import setSetting from "@utils/settings/setSetting.ts";

import Modal from "../../theme/ShadowBox/Modal.tsx";
import styles from "./SettingsModal.module.css";

const SettingsModal: React.FC<{
  show: boolean;
  setShow: (show: boolean) => void;
  audioDevices: Array<MediaDeviceInfo>;
}> = ({ show, setShow, audioDevices }) => {
  const form = useForm<SettingsFormValues>({
    defaultValues: {
      geminiApiKey: getSetting("geminiApiKey"),
      llmProvider: getSetting("llmProvider"),
      speechToTextLanguage: getSetting("speechToTextLanguage"),
      audioInputDeviceId: getSetting("audioInputDeviceId"),
    },
  });

  return (
    <Modal
      show={show}
      setShow={setShow}
      title="Settings"
      classNameContent={styles.root}
      size={ShadowBoxSize.SMALL}
    >
      <FormProvider {...form}>
        <Form
          onSubmit={form.handleSubmit(async (data) => {
            Object.entries(data).map(([key, value]) =>
              setSetting(key as keyof SettingsFormValues, value)
            );
            window.location.reload();
          })}
        >
          <h4>LLM</h4>
          <FormElement
            label="Gemini API key"
            name="geminiApiKey"
            type="text"
            inputType="password"
          />
          <FormElement
            label="LLM Provider"
            name="llmProvider"
            type="select"
            choices={Object.entries(LlmProvider).map(([, label]) => ({
              value: label,
              label: LLM_NAMES[label],
            }))}
          />
          <br />
          <h4>Speech recognition</h4>
          <FormElement
            label="Language"
            name="speechToTextLanguage"
            type="select"
            choices={LANGUAGES}
          />
          <FormElement
            label="Input Device"
            name="audioInputDeviceId"
            type="select"
            choices={[
              { value: "", label: "select..." },
              ...audioDevices.map((device) => ({
                value: device.deviceId,
                label: device.label,
              })),
            ]}
          />
          <br />
          <hr style={{ width: "100%" }} />
          <Button type="submit">Save</Button>{" "}
        </Form>
      </FormProvider>
    </Modal>
  );
};

export default SettingsModal;
