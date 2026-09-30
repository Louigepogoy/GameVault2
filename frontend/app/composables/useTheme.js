export function useTheme() {
  const cookie = useCookie('gamevault-theme', { maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });
  // Shared state; dark is the default.
  const theme = useState('theme', () => (cookie.value === 'light' ? 'light' : 'dark'));

  const toggle = () => {
    theme.value = theme.value === 'dark' ? 'light' : 'dark';
    cookie.value = theme.value;
  };

  return { theme, toggle };
}
