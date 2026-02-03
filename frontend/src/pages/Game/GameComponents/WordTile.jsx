import React from 'react';

const WordTile = ({ word, isDragging, onDragStart, onDragEnd, onTouchStart, onTouchMove, onTouchEnd }) => {
    return (
        <div
            className={`word-card ${isDragging ? 'dragging' : ''}`}
            draggable
            onDragStart={(e) => onDragStart(e, word)}
            onDragEnd={onDragEnd}
            onTouchStart={(e) => onTouchStart && onTouchStart(e, word)}
            onTouchMove={(e) => onTouchMove && onTouchMove(e)}
            onTouchEnd={(e) => onTouchEnd && onTouchEnd(e)}
        >
            {word.word}
        </div>
    );
};

export default WordTile;
