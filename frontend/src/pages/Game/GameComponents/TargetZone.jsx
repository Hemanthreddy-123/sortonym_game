import React from 'react';

const TargetZone = ({
    title,
    words,
    onDragOver,
    onDragEnter,
    onDrop,
    dragOverBox,
    boxKey,
    draggedWord,
    handleDragStart,
    handleDragEnd,
    isTimeExpired,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
}) => {
    const isOver = dragOverBox === boxKey;
    const zoneClass = boxKey === 'synonyms' ? 'synonym-zone' : 'antonym-zone';
    const chipClass = boxKey === 'synonyms' ? 'synonym-chip' : 'antonym-chip';

    return (
        <div
            className={`drop-zone ${zoneClass} ${isOver ? 'drag-over' : ''}`}
            onDragOver={onDragOver}
            onDragEnter={(e) => onDragEnter(e, boxKey)}
            onDrop={(e) => onDrop(e, boxKey)}
            data-zone={boxKey}
        >
            <div className="zone-header">
                <span className="zone-title">{title}</span>
                <span className="zone-count">{words.length}</span>
            </div>
            <div className="zone-content">
                {words.map((word) => (
                    <div
                        key={word.id}
                        className={`word-chip ${chipClass} ${draggedWord?.id === word.id ? 'dragging' : ''}`}
                        draggable={!isTimeExpired}
                        onDragStart={(e) => handleDragStart(e, word)}
                        onDragEnd={handleDragEnd}
                        onTouchStart={(e) => handleTouchStart && handleTouchStart(e, word)}
                        onTouchMove={(e) => handleTouchMove && handleTouchMove(e)}
                        onTouchEnd={(e) => handleTouchEnd && handleTouchEnd(e)}
                    >
                        {word.word}
                    </div>
                ))}
                {words.length === 0 && <div className="zone-placeholder">Drop Here</div>}
            </div>
        </div>
    );
};

export default TargetZone;
