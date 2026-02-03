import React from 'react';
import './CertificatePage.css';
import CertificateSeal from './CertificateComponents/CertificateSeal.jsx';
import CertificateSignature from './CertificateComponents/CertificateSignature.jsx';

const CertificatePage = React.forwardRef(({ member, level }, ref) => {
    const completionDate = new Date().toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    const certificateId = `SCN-${Math.floor(100000 + Math.random() * 900000)}`;

    return (
        <div ref={ref} className="certificate-snapshot-container">
            <div className="certificate-modern-wrapper">
                {/* Decorative Corners */}
                <div className="corner-decor top-left"></div>
                <div className="corner-decor top-right"></div>
                <div className="corner-decor bottom-left"></div>
                <div className="corner-decor bottom-right"></div>

                <div className="cert-content-area">
                    {/* Header */}
                    <div className="cert-header-modern">
                        <div className="app-logo-mark">
                            <i className="bi bi-intersect"></i>
                        </div>
                        <span className="app-name-tracking">SORTONYM CHALLENGE</span>
                    </div>

                    {/* Main Title Block */}
                    <div className="cert-title-block">
                        <h2 className="title-top">CERTIFICATE</h2>
                        <h1 className="title-main">OF ACHIEVEMENT</h1>
                        <div className="title-divider"></div>
                    </div>

                    {/* Recipient */}
                    <div className="cert-recipient-section">
                        <p className="recipient-label">THIS CERTIFICATE IS AWARDED TO</p>
                        <h3 className="recipient-name">{member?.name || 'Valued Player'}</h3>
                        <p className="recipient-body">
                            For successfully completing the <strong>{level} LEVEL</strong><br />
                            demonstrating speed, accuracy, and vocabulary mastery.
                        </p>
                    </div>

                    {/* Footer / Signature / Seal */}
                    <div className="cert-footer-modern">
                        <div className="footer-seg date-seg">
                            <span className="seg-label">DATE</span>
                            <span className="seg-value">{completionDate}</span>
                        </div>

                        <div className="footer-seg seal-seg">
                            <div className="modern-seal">
                                <i className="bi bi-patch-check-fill"></i>
                                <span>VERIFIED</span>
                            </div>
                        </div>

                        <div className="footer-seg sig-seg">
                            <div className="sig-image">Station-S Team</div>
                            <div className="seg-line"></div>
                            <span className="seg-label">AUTHORIZED SIGNATURE</span>
                        </div>
                    </div>

                    {/* Meta ID */}
                    <div className="cert-meta-id">ID: {certificateId}</div>
                </div>
            </div>
        </div>
    );
});

export default CertificatePage;
