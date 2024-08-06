import "./Loader.css";

type loaderProps = {
    size?: "s" | "m" | "xl";
};

const Loader = ({ size }: loaderProps = {}) => {
  const sizeClass = `lds-spinner--${size}`;
  return (
    <div className={`lds-spinner ${sizeClass}`}>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  );
};

export default Loader;
