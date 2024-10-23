import React from 'react';
import styles from './Kitt.module.css';
import cn from '@utils/classnames.ts';

const getRowOpacity = (rowIndex: number, rows: number): number => {
  const middleRowIndex = Math.floor(rows / 2);
  const maxRowDistance = Math.max(middleRowIndex, rows - middleRowIndex - 1);
  const rowDistance = Math.abs(rowIndex - middleRowIndex);
  return 1 - rowDistance / maxRowDistance;
};

// todo: volume should not have mor influence on cells in the middle than on the edges
const getVolumePerCell = (
  volume: number,
  rowIndex: number,
  rows: number
): number => {
  const middleIndex = Math.floor(rows / 2);
  const maxDistance = Math.max(middleIndex, rows - middleIndex - 1);
  const distance = Math.abs(rowIndex - middleIndex);
  const baseOpacity = 1 - distance / maxDistance;
  return baseOpacity * volume + (1 - baseOpacity) * (volume * 0.6);
};

const Kitt: React.FC<{
  rows?: number;
  cols?: number;
  volume?: number;
  className?: string;
}> = ({ rows = 19, cols = 3, volume = 1, className = '' }) => (
  <div className={cn(className, styles.root)}>
    {new Array(cols).fill('').map((_, colIndex) => (
      <div className={styles.col} key={colIndex}>
        {new Array(rows).fill('').map((_, rowIndex) => {
          const rowOpacity = getRowOpacity(rowIndex, rows);
          const colOpacity = colIndex === 0 || colIndex === cols - 1 ? 0.5 : 1;
          const opacity =
            rowOpacity * colOpacity * getVolumePerCell(volume, rowIndex, rows);

          return (
            <div
              className={styles.cell}
              style={{ opacity }}
              key={colIndex + '-' + rowIndex}
            />
          );
        })}
      </div>
    ))}
  </div>
);

export default Kitt;
