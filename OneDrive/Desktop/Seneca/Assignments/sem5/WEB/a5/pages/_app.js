// pages/_app.js
import 'bootstrap/dist/css/bootstrap.min.css'; 
import '@/styles/globals.css';

import Layout from '@/components/Layout';
import { SWRConfig } from 'swr';
import RouteGuard from '@/components/RouteGuard';

export default function App({ Component, pageProps }) {
  return (
    <SWRConfig value={{
      fetcher: async (url) => {
        const res = await fetch(url);
        const text = await res.text(); // read raw once
        let data;
        try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }

        if (!res.ok) {
          const error = new Error(data?.message || 'Fetch failed');
          error.info = data;
          error.status = res.status;
          throw error;
        }
        return data;
      }
    }}>
      <RouteGuard>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </RouteGuard>
    </SWRConfig>
  );
}
