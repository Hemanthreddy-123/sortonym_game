import React from 'react';

const GameButton = ({ label, onClick, disabled, variant = 'primary', icon }) => {
    const className = `btn btn-${variant}`;
    return (
        <button className={className} onClick={onClick} disabled={disabled}>
            {icon && <i className={`bi ${icon}`}></i>} {label}
        </button>
    );
};

export default GameButton;
