# Standalone Score Page

A standalone HTML/CSS/JavaScript version of the Sortonym Challenge score/result page that can be tested independently before React conversion.

## 📁 Files

- `index.html` - Page structure
- `styles.css` - Responsive styling (desktop + mobile)
- `script.js` - Functionality and animations

## 🚀 How to Run

### Option 1: Direct Open
Simply open `index.html` in your browser (double-click or right-click → Open with → Browser)

### Option 2: Local Server (Recommended)
```bash
# Using Python
python -m http.server 8000

# Using Node.js (if you have http-server installed)
npx http-server

# Using VS Code Live Server extension
# Right-click index.html → Open with Live Server
```

Then navigate to `http://localhost:8000`

## 📱 Features

### Desktop View (> 900px)
- 3-column grid layout
- Left: Synonyms list
- Center: Score, stats, buttons
- Right: Antonyms list
- Fixed height container

### Mobile View (< 900px)
- Stacked layout
- Center panel at top (compact)
- Synonyms and Antonyms panels fill remaining height
- Each panel scrolls independently
- Touch-friendly

### Functionality
- ✅ Animated score ring
- ✅ Score counter animation (ease-out)
- ✅ Dynamic color based on score
- ✅ Word lists with correct/incorrect indicators
- ✅ Button handlers (Play Again, Certificate, Share, Exit)
- ✅ Responsive design
- ✅ Touch scroll support

## 🎨 Design

- **Theme**: Clean, modern, professional
- **Colors**: Green (correct), Red (incorrect), Blue (primary)
- **Font**: Outfit (Google Fonts)
- **Icons**: Bootstrap Icons

## 📊 Sample Data

The page currently uses sample game data defined in `script.js`:
```javascript
const gameResults = {
    score: 9.5,
    maxScore: 20,
    totalCorrect: 6,
    totalWords: 8,
    timeBonus: 0.5,
    level: 'EASY',
    synonymBox: [...],
    antonymBox: [...]
};
```

**To test with different data:** Edit the `gameResults` object in `script.js`

## 🔄 Converting to React

When ready to convert to React:

1. **HTML → JSX**
   - Copy structure from `index.html`
   - Convert class → className
   - Convert inline styles to objects
   - Import Bootstrap Icons

2. **CSS → React CSS**
   - Move styles to `ScorePage.css`
   - Or use CSS modules

3. **JavaScript → React Hooks**
   - `gameResults` → props from location.state
   - Animation → useEffect with requestAnimationFrame
   - Button handlers → navigation functions

4. **Integration**
   - Add route `/score` in App.jsx
   - Pass data via navigate('/score', { state: { ... } })
   - Import useLocation, useNavigate

## 📝 Notes

- Mobile scrolling works for word lists (not page scroll)
- Score animation duration: 1.5 seconds
- Breakpoint: 900px (desktop/mobile)
- All buttons have console.log + alert for testing

## 🧪 Testing Checklist

- [ ] Desktop view (> 900px) - 3 columns aligned
- [ ] Mobile view (< 900px) - stacked layout
- [ ] Score animation works smoothly
- [ ] Word lists scroll on mobile
- [ ] All buttons clickable
- [ ] Responsive at various screen sizes
- [ ] Touch scrolling works on mobile devices

## 🎯 Next Steps

1. Test on desktop browser
2. Test on mobile device or DevTools mobile emulation
3. Adjust sample data to test different scores
4. Convert to React when satisfied with design/functionality
