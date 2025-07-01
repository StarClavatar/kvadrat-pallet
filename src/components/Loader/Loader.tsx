import "./Loader.css";

type loaderProps = {
  size?: "s" | "m" | "xl";
  color?: string;
};

const Loader = ({ size = "m", color = "#fff" }: loaderProps = {}) => {
  const sizeClass = `lds-spinner--${size}`;
  return (
    <div className="loader-overlay">
      <div className={`lds-spinner ${sizeClass}`} style={{ color }}>
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
    </div>
  );
};

export default Loader;
