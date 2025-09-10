import React from "react";
import classes from "./FullScreenSpinner.module.scss";
import Spinner from "./Spinner";

interface FullScreenSpinnerProps {
  isVisible?: boolean;
  message?: string;
}

const FullScreenSpinner: React.FC<FullScreenSpinnerProps> = ({
  isVisible = false,
  message = "",
}) => {
  if (!isVisible) {
    return null;
  }

  return (
    <div className={classes.LoaderBackground}>
      <div className={classes.SpinnerWrapper}>
        <Spinner className={classes.Loader} />
      </div>
      <h3>{message}</h3>
    </div>
  );
};

export default FullScreenSpinner;
