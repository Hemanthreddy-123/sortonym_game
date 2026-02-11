import React from 'react';

const CertificateSeal = () => {
    return (
        <div className="cert-badge-container">
            <div className="verified-badge">
                <i className="bi bi-square badge-icon"></i>
            </div>
            <div className="cert-id" style={{ background: '#E6F4EE' }}>ID: SCN-598544</div>
        </div>
    );
};

export default CertificateSeal;
