import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import './TeamGameLobby.css'; // Reusing existing styles

const CreateTeamPage = () => {
    const navigate = useNavigate();
    const { member, token } = useAuth();

    // Team Creation States
    const [teamAvatar, setTeamAvatar] = useState(null);
    const [teamColor, setTeamColor] = useState('#00A63F');
    const [teamName, setTeamName] = useState('');
    const [teamTag, setTeamTag] = useState('');
    const [teamDescription, setTeamDescription] = useState('');
    const [teamRegion, setTeamRegion] = useState('');
    const [isPrivateTeam, setIsPrivateTeam] = useState(false);
    const [requireApplication, setRequireApplication] = useState(false);
    const [allowTeamChat, setAllowTeamChat] = useState(true);
    const [teamSize, setTeamSize] = useState('10');
    const [isLoading, setIsLoading] = useState(false);
    const [showTips, setShowTips] = useState(false);

    // Searchable Region States
    const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false);
    const [regionSearchQuery, setRegionSearchQuery] = useState('');

    const countries = [
        "India", "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua & Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
        "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
        "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic",
        "Denmark", "Djibouti", "Dominica", "Dominican Republic",
        "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia",
        "Fiji", "Finland", "France",
        "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
        "Haiti", "Honduras", "Hungary",
        "Iceland", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Ivory Coast",
        "Jamaica", "Japan", "Jordan",
        "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan",
        "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
        "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar",
        "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway",
        "Oman",
        "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
        "Qatar",
        "Romania", "Russia", "Rwanda",
        "Saint Kitts & Nevis", "Saint Lucia", "Samoa", "San Marino", "Sao Tome & Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
        "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad & Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
        "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan",
        "Vanuatu", "Vatican City", "Venezuela", "Vietnam",
        "Yemen",
        "Zambia", "Zimbabwe"
    ];

    const filteredCountries = countries.filter(country =>
        country.toLowerCase().includes(regionSearchQuery.toLowerCase())
    );

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isRegionDropdownOpen && !event.target.closest('.region-select-wrapper')) {
                setIsRegionDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isRegionDropdownOpen]);

    const teamColors = [
        '#00A63F', // Green
        '#009688', // Teal
        '#3b82f6', // Blue
        '#a855f7', // Purple
        '#ef4444', // Red
        '#f97316', // Orange
        '#eab308', // Yellow
        '#475569', // Slate
    ];

    // --- API HELPERS ---
    const authenticatedFetch = async (url, options = {}) => {
        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers
        };

        try {
            const response = await fetch(url, { ...options, headers });

            // Check content type or size before parsing JSON
            const contentType = response.headers.get("content-type");
            let data = null;

            if (contentType && contentType.includes("application/json")) {
                const text = await response.text();
                data = text ? JSON.parse(text) : {};
            } else {
                // If not JSON, handle as text or empty
                data = {};
            }

            if (!response.ok) {
                const errorMessage = data.error || data.message || `API Error: ${response.status}`;
                throw new Error(errorMessage);
            }

            return data;
        } catch (error) {
            console.error("Fetch Error:", error);
            throw error;
        }
    };

    const handleCreateTeam = async () => {
        if (!teamName.trim()) { alert('Please enter a team name'); return; }
        if (!teamTag.trim()) { alert('Please enter a team tag'); return; }

        setIsLoading(true);
        try {
            const data = await authenticatedFetch('/api/lobby/create', {
                method: 'POST',
                body: JSON.stringify({ teamName, teamTag })
            });
            console.log('Lobby Created:', data);

            // Navigate to Lobby with the new Game Code
            navigate('/team-lobby', {
                state: {
                    gameCode: data.code,
                    isHost: true // Explicitly passing host status
                }
            });
        } catch (err) {
            console.error('Create Team Error:', err);
            alert(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveAsDraft = () => {
        localStorage.setItem('teamDraft', JSON.stringify({ teamName, teamTag, teamColor }));
        alert('Team saved as draft!');
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setTeamAvatar(reader.result);
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="team-builder-page">
            {/* Navigation */}
            <div className="team-builder-nav">
                <button className="back-link" onClick={() => navigate('/home')}>
                    <i className="bi bi-arrow-left"></i>
                    <span>Back to Home</span>
                </button>
            </div>

            <div className="team-builder-container">
                {/* Header */}
                <div className="team-builder-header">
                    <h1>Build Your Dream Team</h1>
                    <p>Create a unique identity, set your rules, and prepare for battle.</p>
                </div>

                <div className="team-builder-content">

                    {/* Left Column: Visual Identity */}
                    <div className="builder-column-left">
                        <div className="section-card">
                            <h3 className="section-title"><i className="bi bi-palette-fill"></i> Visual Identity</h3>

                            <div className="visual-identity-group">
                                <div className="avatar-preview-wrapper">
                                    <div className={`avatar-preview ${teamAvatar ? 'has-image' : ''}`}>
                                        {teamAvatar ? (
                                            <img src={teamAvatar} alt="Team Avatar" />
                                        ) : (
                                            <i className="bi bi-image"></i>
                                        )}
                                    </div>
                                    <label htmlFor="avatar-upload" className="avatar-edit-btn" title="Upload Image">
                                        <i className="bi bi-camera-fill"></i>
                                    </label>
                                    <input
                                        id="avatar-upload"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        style={{ display: 'none' }}
                                    />
                                </div>

                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: '#4b5563' }}>Team Color</label>
                                    <div className="color-picker-compact">
                                        {teamColors.map(color => (
                                            <div
                                                key={color}
                                                className={`color-dot ${teamColor === color ? 'selected' : ''}`}
                                                style={{ backgroundColor: color }}
                                                onClick={() => setTeamColor(color)}
                                                title={color}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="section-card">
                            <h3 className="section-title"><i className="bi bi-card-text"></i> Team Info</h3>

                            <div className="modern-input-group">
                                <label>Team Name <span className="required">*</span></label>
                                <input
                                    type="text"
                                    className="modern-input"
                                    placeholder="e.g. Thunder Warriors"
                                    value={teamName}
                                    onChange={(e) => setTeamName(e.target.value)}
                                    maxLength={25}
                                />
                            </div>

                            <div className="modern-input-group">
                                <label>Team Tag <span className="required">*</span></label>
                                <div className="tag-input-wrapper">
                                    <span className="tag-prefix">#</span>
                                    <input
                                        type="text"
                                        className="modern-input tag-field"
                                        placeholder="TAG"
                                        value={teamTag}
                                        onChange={(e) => setTeamTag(e.target.value.toUpperCase())}
                                        maxLength={5}
                                    />
                                </div>
                                <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>{teamTag.length}/5</div>
                            </div>

                            <div className="modern-input-group">
                                <label>Region <span className="required">*</span></label>
                                <div className="region-select-wrapper">
                                    <div
                                        className={`modern-input region-input-trigger ${isRegionDropdownOpen ? 'open' : ''}`}
                                        onClick={() => setIsRegionDropdownOpen(!isRegionDropdownOpen)}
                                    >
                                        {teamRegion || "Select your region"}
                                    </div>

                                    {isRegionDropdownOpen && (
                                        <div className="region-dropdown">
                                            <div className="dropdown-search-wrapper">
                                                <input
                                                    type="text"
                                                    className="dropdown-search-input"
                                                    placeholder="Search region..."
                                                    value={regionSearchQuery}
                                                    onChange={(e) => setRegionSearchQuery(e.target.value)}
                                                    autoFocus
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </div>
                                            <div className="dropdown-options">
                                                {filteredCountries.map(country => (
                                                    <div
                                                        key={country}
                                                        className={`region-option ${teamRegion === country ? 'selected' : ''}`}
                                                        onClick={() => {
                                                            setTeamRegion(country);
                                                            setIsRegionDropdownOpen(false);
                                                            setRegionSearchQuery('');
                                                        }}
                                                    >
                                                        {country}
                                                    </div>
                                                ))}
                                                {filteredCountries.length === 0 && (
                                                    <div className="no-results">No regions found matching "{regionSearchQuery}"</div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Details & Settings */}
                    <div className="builder-column-right">
                        <div className="section-card">
                            <h3 className="section-title"><i className="bi bi-sliders"></i> Game Settings</h3>

                            <div className="settings-grid">
                                <div className="setting-card">
                                    <div className="setting-text">
                                        <h4>Private Team</h4>
                                        <p>Invite only</p>
                                    </div>
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={isPrivateTeam}
                                            onChange={(e) => setIsPrivateTeam(e.target.checked)}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>

                                <div className="setting-card">
                                    <div className="setting-text">
                                        <h4>Applications</h4>
                                        <p>Review join requests</p>
                                    </div>
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={requireApplication}
                                            onChange={(e) => setRequireApplication(e.target.checked)}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>

                                <div className="setting-card">
                                    <div className="setting-text">
                                        <h4>Team Size</h4>
                                        <p>Max players</p>
                                    </div>
                                    <select
                                        value={teamSize}
                                        onChange={(e) => setTeamSize(e.target.value)}
                                        className="modern-input"
                                        style={{ padding: '0.5rem', width: 'auto', minWidth: '80px', fontSize: '0.9rem' }}
                                    >
                                        <option value="5">5</option>
                                        <option value="10">10</option>
                                        <option value="15">15</option>
                                        <option value="25">25</option>
                                        <option value="custom">Custom</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="section-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <h3 className="section-title"><i className="bi bi-chat-square-text-fill"></i> Manifesto</h3>
                            <div className="modern-input-group" style={{ flex: 1, display: 'flex', flexDirection: 'column', marginBottom: 0 }}>
                                <textarea
                                    className="modern-input"
                                    placeholder="Describe your team's mission, playstyle, and goals..."
                                    value={teamDescription}
                                    onChange={(e) => setTeamDescription(e.target.value)}
                                    style={{ flex: 1, minHeight: '120px', resize: 'none' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="builder-footer">
                        <button className="tips-toggle-btn" onClick={() => setShowTips(true)}>
                            <i className="bi bi-lightbulb"></i> View Tips
                        </button>

                        <div className="action-group">
                            <button className="btn-secondary" onClick={handleSaveAsDraft}>
                                Save Draft
                            </button>
                            <button className="btn-primary-lg" onClick={handleCreateTeam} disabled={isLoading}>
                                {isLoading ? (
                                    <span>Creating...</span>
                                ) : (
                                    <>
                                        <span>Create Team</span>
                                        <i className="bi bi-arrow-right"></i>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tips Modal */}
            {showTips && (
                <div className="tips-modal-overlay" onClick={() => setShowTips(false)}>
                    <div className="tips-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="tips-header">
                            <h2><i className="bi bi-lightbulb-fill" style={{ color: '#FCD34D' }}></i> Pro Team Building Tips</h2>
                            <button className="close-tips-btn" onClick={() => setShowTips(false)}>
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>

                        <ul className="tips-list">
                            <li>
                                <i className="bi bi-check-circle-fill"></i>
                                <span><strong>Choose distinct colors:</strong> Helps distinguish your team instantly on the battlefield.</span>
                            </li>
                            <li>
                                <i className="bi bi-fonts"></i>
                                <span><strong>Short Tags (3-4 chars):</strong> Are easier to read on leaderboards (e.g., [VOID]).</span>
                            </li>
                            <li>
                                <i className="bi bi-people-fill"></i>
                                <span><strong>Recruit Wisely:</strong> Balance your team size. Smaller teams can coordinate faster!</span>
                            </li>
                            <li>
                                <i className="bi bi-shield-lock-fill"></i>
                                <span><strong>Private Teams:</strong> Great for playing with close friends without interruptions.</span>
                            </li>
                        </ul>

                        <button className="tips-footer-btn" onClick={() => setShowTips(false)}>
                            Got it!
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateTeamPage;
