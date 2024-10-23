import React from "react";
import styles from "./Cockpit.module.css";
import cn from "@utils/classnames.ts";
import { Button, Display, Kitt } from "@theme";

import useInterpolation from "@utils/hooks/useInterpolation.ts";
import useWriteText from "@utils/hooks/useWriteText.ts";
import ConnectCar from "@app/ConnectCar.tsx";

const Cockpit: React.FC<{ className?: string }> = ({ className = "" }) => {
  const { value, start } = useInterpolation(
    [0, 10, 20, 30, 40, 50, 60],
    [0, 1, 0, 1, 0, 1, 0]
  );
  const { value: text, start: startWriting } = useWriteText("Good morning..");

  React.useEffect(() => {
    startWriting();
  }, []);

  return (
    <div className={cn(className, styles.root)}>
      <div className={styles.top}>
        <div className={styles.left}>
          <ConnectCar />
          <Button color="yellow" disabled>
            Listen
          </Button>
          <Button color="yellow" disabled>
            Stop!
          </Button>
        </div>
        <Display className={styles.display} message={text} />
        <div className={styles.right}>
          <Button color="yellow" disabled>
            Camera
          </Button>
          <Button color="yellow" disabled />
          <Button color="yellow" disabled />
        </div>
      </div>
      <Kitt className={styles.kitt} volume={value} />
    </div>
  );
};

export default Cockpit;
