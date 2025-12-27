import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';

export const useKeyboardShortcuts = () => {
  const navigate = useNavigate();
  const { state, actions } = useApp();

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Check if user is typing in an input field
      const activeElement = document.activeElement;
      const isTyping = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.contentEditable === 'true'
      );

      // Don't trigger shortcuts while typing, unless it's a global shortcut
      if (isTyping && !event.ctrlKey && !event.metaKey) {
        return;
      }

      // Global shortcuts (Ctrl/Cmd + key)
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'k':
            event.preventDefault();
            // Focus search (implement search functionality)
            break;
          default:
            break;
        }
        return;
      }

      // Regular shortcuts (only when not typing)
      if (!isTyping) {
        switch (event.key.toLowerCase()) {
          case 'n':
            event.preventDefault();
            // Open new transaction form
            break;
          case 'r':
            event.preventDefault();
            navigate('/recurring');
            break;
          case 'b':
            event.preventDefault();
            // Trigger backup
            break;
          case 'e':
            event.preventDefault();
            // Open export dialog
            break;
          case '/':
            event.preventDefault();
            // Focus search
            break;
          case '?':
            event.preventDefault();
            // Show keyboard shortcuts help
            break;
          case 'g':
            // Go to shortcuts
            const nextKey = event.key;
            setTimeout(() => {
              const handleNextKey = (nextEvent) => {
                switch (nextEvent.key.toLowerCase()) {
                  case 'd':
                    navigate('/');
                    break;
                  case 't':
                    navigate('/transactions');
                    break;
                  case 'r':
                    navigate('/recurring');
                    break;
                  case 'b':
                    navigate('/budgets');
                    break;
                  case 'p':
                    navigate('/people');
                    break;
                  case 's':
                    navigate('/settings');
                    break;
                }
                document.removeEventListener('keydown', handleNextKey, { once: true });
              };
              document.addEventListener('keydown', handleNextKey, { once: true });
            }, 100);
            break;
          default:
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navigate, actions]);
};