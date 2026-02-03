import React from 'react';

const Timer = ({ timeLeft, formatTime }) => {
    return (
        <div className={`header-timer ${timeLeft <= 10 ? 'critical' : ''}`}>
            {formatTime(timeLeft)}
        </div>
    );
};

export default Timer;
