import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

const rootStyle = {
  display:'flex',
  position: 'relative',
  cursor: 'pointer',
  padding: '10px 10px',
  margin: '10px 0',
  borderRadius: "8px",
  background: 'gold',
  boxShadow: '0 1px 1px rgba(0,0,0,0.15)'
}

const popupStyle = {
  position: 'absolute',
  left: 0,
  bottom: "60px",
  width: '100%',
  background: 'white',
  boxShadow: '0 4px 4px 4px rgba(0,0,0,0.15)',
  padding: '10px 10px',
}

const ReviewNote = ({author, children, id}) => {
  const [display, setDisplay] = React.useState('none');
  const [keepDisplayed, setKeepDisplayed] = React.useState(false);
  const [root, setRoot] = React.useState(null);
  const handleMouseLeave = React.useCallback(() => {
    if (keepDisplayed) return;
    setDisplay('none');
  }, [keepDisplayed]);

  React.useEffect(() => {
    if (!root) return;

    const handleClick = (event) => {
      if (!root.contains(event.target)) {
        setKeepDisplayed(false)
      }
    }
    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
    }
  }, [root]);

  return (
    <BrowserOnly>
      {() => window.location.hostname === 'localhost' ? (
        <div style={rootStyle}
             onClick={(event) => {
               event.stopPropagation();
               setKeepDisplayed(prev => !prev);
             }}
             onMouseEnter={() => setDisplay('block')}
             onMouseLeave={handleMouseLeave}
             ref={setRoot}
        >
          <div style={{display, ...popupStyle}}>

            <div style={{ width: '100%'}}>{children}</div>
          </div>
          <div style={{display: 'flex', justifyContent: 'space-between', width: '100%'}}>
            <div>Review note {author && <span style={{fontSize: '10px'}}>[author: {author}]</span>}</div>< div style={{fontSize: '10px'}}>[{id}]</div>

          </div>

        </div>
      ): null}
    </BrowserOnly>
  );
}

export default ReviewNote;
