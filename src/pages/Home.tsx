import { A } from '@solidjs/router';

export default function Home() {
  return (
    <div class="container">
      <div style="text-align: center; padding: 4rem 2rem;">
        <h1>Calendly Clone</h1>
        <p style="margin: 2rem 0; font-size: 1.2rem; color: #666;">
          Schedule meetings easily with our booking system
        </p>
        <div style="margin-top: 2rem;">
          <A href="/booking" class="btn btn-primary" style="margin-right: 1rem;">
            View Available Slots
          </A>
          <A href="/login" class="btn btn-secondary">
            Host Login
          </A>
        </div>
      </div>
    </div>
  );
}

