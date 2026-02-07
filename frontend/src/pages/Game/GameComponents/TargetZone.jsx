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

    // Figma design specifics
    const isSynonym = boxKey === 'synonyms';
    const iconClass = isSynonym ? 'bi-check-circle-fill' : 'bi-x-circle-fill';
    const iconColor = isSynonym ? '#00A63F' : '#FA6060';
    const placeholderLine1 = isSynonym ? 'Drop synonyms here' : 'Drop antonyms here';
    const placeholderLine2 = isSynonym ? 'Words with similar meanings' : 'Words with opposite meanings';

    return (
        <div
            className={`drop-zone ${zoneClass} ${isOver ? 'drag-over' : ''}`}
            onDragOver={onDragOver}
            onDragEnter={(e) => onDragEnter(e, boxKey)}
            onDrop={(e) => onDrop(e, boxKey)}
            data-zone={boxKey}
        >
            <div className="zone-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className={`bi ${iconClass}`} style={{
                        fontSize: '16px',
                        color: iconColor
                    }}></i>
                    <span className="zone-title">{title}</span>
                </div>
                <span className="zone-count">0/{words.length + (8 - words.length)}</span>
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
                {words.length === 0 && (
                    <div className="zone-placeholder">
                        <div style={{
                            fontSize: '13px',
                            fontWeight: '600',
                            color: '#9CA3AF',
                            marginBottom: '4px'
                        }}>{placeholderLine1}</div>
                        <div style={{
                            fontSize: '11px',
                            fontWeight: '500',
                            color: '#CBD5E1'
                        }}>{placeholderLine2}</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TargetZone;
