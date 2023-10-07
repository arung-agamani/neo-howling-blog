import React, { PropsWithChildren } from "react";
import "./floating-container.css";

const FloatingContainer: React.FC<PropsWithChildren> = (props) => {
    return (
        <div className="floating-container flex gap-3">{props.children}</div>
    );
};
export default FloatingContainer;
