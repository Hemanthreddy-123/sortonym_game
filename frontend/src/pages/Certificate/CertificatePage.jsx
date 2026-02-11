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
                {/* Decorative Elements */}
                <div className="geo-accent accent-circle-top"></div>
                <div className="geo-accent accent-circle-bottom"></div>

                <div className="cert-content-area">
                    {/* Header: Brand Name */}
                    <div className="cert-header">
                        <div className="brand-tag">
                            <i className="bi bi-square"></i> SORTONYM CHALLENGE
                        </div>
                    </div>

                    {/* Title Section */}
                    <div className="cert-title-group">
                        <h2 className="cert-title-medium">CERTIFICATE</h2>
                        <h1 className="cert-title-large">OF ACHIEVEMENT</h1>
                    </div>

                    {/* Recipient Section */}
                    <div className="cert-recipient-group">
                        <p className="recipient-intro">This certificate is awarded to</p>
                        <h3 className="recipient-name">{member?.name || 'Valued Player'}</h3>
                        <p className="recipient-body">
                            For successfully completing the <strong>{level} LEVEL</strong>, demonstrating exceptional speed, accuracy, and vocabulary mastery.
                        </p>
                    </div>

                    {/* Footer Section */}
                    <div className="cert-footer">
                        {/* Left: Date */}
                        <div className="footer-col left">
                            <div className="cert-date">
                                <div className="meta-value">{completionDate}</div>
                                <div className="meta-label">DATE</div>
                            </div>
                        </div>

                        {/* Center: Badge */}
                        <div className="footer-col center">
                            <CertificateSeal />
                        </div>

                        {/* Right: Signature */}
                        <div className="footer-col right">
                            <CertificateSignature />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default CertificatePage;
