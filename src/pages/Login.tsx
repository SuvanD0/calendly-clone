import { onMount } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { getGoogleAuthUrl } from '../lib/api';

export default function Login() {
  const navigate = useNavigate();

  onMount(() => {
    // Redirect to Google OAuth
    window.location.href = getGoogleAuthUrl();
  });

  return (
    <div class="container">
      <div style="text-align: center; padding: 4rem 2rem;">
        <p>Redirecting to Google login...</p>
      </div>
    </div>
  );
}

