import React from 'react';
import styles from './Kitt.module.css';

const getRowOpacity = (rowIndex: number, rows: number): number => {
  const middleRowIndex = Math.floor(rows / 2);
  const maxRowDistance = Math.max(middleRowIndex, rows - middleRowIndex - 1);
  const rowDistance = Math.abs(rowIndex - middleRowIndex);
  return 1 - rowDistance / maxRowDistance;
};

const Kitt: React.FC<{ rows?: number; cols?: number; volume?: number }> = ({
  rows = 19,
  cols = 3,
  volume = 1,
}) => (
  <div className={styles.root}>
    {new Array(cols).fill('').map((_, colIndex) => (
      <div className={styles.col} key={colIndex}>
        {new Array(rows).fill('').map((_, rowIndex) => {
          const rowOpacity = getRowOpacity(rowIndex, rows);
          const colOpacity = colIndex === 0 || colIndex === cols - 1 ? 0.5 : 1;
          const opacity = rowOpacity * colOpacity * volume;
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
