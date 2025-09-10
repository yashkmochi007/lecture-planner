import React from "react";
import classes from "./Spinner.module.scss";

const Spinner: React.FC<React.HTMLAttributes<HTMLDivElement>> = (
  extraProps
) => {
  return (
    <div
      {...extraProps}
      className={`${classes.Loader} ${extraProps.className}`}
    />
  );
};

export default Spinner;
