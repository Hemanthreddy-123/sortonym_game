import React from 'react';

const GameButton = ({ label, onClick, disabled, variant = 'primary', icon, style }) => {
    const className = `btn btn-${variant}`;
    return (
        <button className={className} onClick={onClick} disabled={disabled} style={style}>
            {icon && <i className={`bi ${icon}`}></i>} {label}
        </button>
    );
};

export default GameButton;
