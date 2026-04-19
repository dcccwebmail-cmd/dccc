import React, { useEffect } from 'react';

const PageTitle: React.FC<{ title: string }> = ({ title }) => {
  useEffect(() => {
    // Also update the main og:title and twitter:title meta tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const twitterTitle = document.querySelector('meta[property="twitter:title"]');

    document.title = title;
    if (ogTitle) ogTitle.setAttribute('content', title);
    if (twitterTitle) twitterTitle.setAttribute('content', title);

  }, [title]);

  return null; // This component doesn't render anything
};

export default PageTitle;