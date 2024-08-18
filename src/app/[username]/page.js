'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { request, gql } from 'graphql-request';

const GITHUB_API = 'https://api.github.com/graphql';

const query = gql`
  query ($username: String!) {
    user(login: $username) {
      name
      login
      avatarUrl
      pullRequests(first: 100, orderBy: { field: CREATED_AT, direction: DESC }) {
        nodes {
          title
          url
          state
          createdAt
          repository {
            nameWithOwner
            stargazerCount
            owner {
              avatarUrl
            }
          }
        }
      }
    }
  }
`;

export default function UserContributions() {
  const { username } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sort, setSort] = useState('star');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (username) {
      const fetchData = async () => {
        try {
          const response = await request(GITHUB_API, query, { username }, {
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          });
          setData(response.user);
        } catch (err) {
          setError(err);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [username]);

  if (loading) return <div className="flex justify-center items-center min-h-screen"><div className="loader"></div></div>;
  if (error) return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
      <h1 className="text-4xl font-bold mb-4">unable to find this username</h1>
      <p className="text-lg">please make sure the username is correct</p>
    </main>
  );
  if (!data) return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
      <h1 className="text-4xl font-bold mb-4">unable to find this username</h1>
      <p className="text-lg">please make sure the username is correct</p>
    </main>
  );

  const hasContributions = data.pullRequests.nodes.length > 0;

  // Exclude PRs from the user's own repositories
  const filteredPRs = data.pullRequests.nodes.filter(pr => !pr.repository.nameWithOwner.startsWith(`${data.login}/`));

  const groupedPRs = filteredPRs.reduce((acc, pr) => {
    const repoName = pr.repository.nameWithOwner;
    if (!acc[repoName]) {
      acc[repoName] = {
        prs: [],
        avatarUrl: pr.repository.owner.avatarUrl,
      };
    }
    acc[repoName].prs.push(pr);
    return acc;
  }, {});

  const sortedPRs = Object.entries(groupedPRs).sort((a, b) => {
    if (sort === 'star') {
      return b[1].prs[0].repository.stargazerCount - a[1].prs[0].repository.stargazerCount;
    } else if (sort === 'latest') {
      return new Date(b[1].prs[0].createdAt) - new Date(a[1].prs[0].createdAt);
    } else if (sort === 'oldest') {
      return new Date(a[1].prs[0].createdAt) - new Date(b[1].prs[0].createdAt);
    }
    return 0;
  });

  const finalFilteredPRs = sortedPRs.map(([repoName, { prs, avatarUrl }]) => {
    return [
      repoName,
      prs.filter(pr => filter === 'all' || pr.state.toLowerCase() === filter),
      avatarUrl,
    ];
  }).filter(([repoName, prs]) => prs.length > 0);

  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const profileUrl = `${window.location.origin}/${data.login}`;
  const toolUrl = `${window.location.origin}`;
  const shareText = `I have ${data.pullRequests.nodes.length} contributions on open-source projects.\nCheck out my profile at ${profileUrl}\n\nGive it a try yourself at ${toolUrl}`;
  const twitterUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?mini=true&url=${encodeURIComponent(profileUrl)}&summary=${encodeURIComponent(shareText)}`;
  const supportUrl = 'https://github.com/depapp/my-open-source-contributions?tab=readme-ov-file#muscle-support-me';

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-24">
      <h1 className="text-4xl font-bold mb-8 text-center">My Open-Source Contribution on GitHub</h1>
      <div className="flex flex-col items-center mb-8">
        <img src={data.avatarUrl} alt={data.login} className="rounded-full w-24 h-24 mb-4" />
        <h2 className="text-2xl">{data.name}</h2>
        <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500">
          @{data.login}
        </a>
      </div>
      <div className="flex space-x-4 mb-8">
        <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center">
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M23.954 4.569c-.885.389-1.83.654-2.825.775 1.014-.611 1.794-1.574 2.163-2.723-.951.555-2.005.959-3.127 1.184-.897-.959-2.178-1.559-3.594-1.559-2.717 0-4.92 2.203-4.92 4.917 0 .39.045.765.127 1.124-4.087-.205-7.713-2.165-10.141-5.144-.422.722-.666 1.561-.666 2.475 0 1.71.87 3.213 2.188 4.096-.807-.026-1.566-.248-2.228-.616v.061c0 2.385 1.693 4.374 3.946 4.827-.413.111-.849.171-1.296.171-.314 0-.615-.03-.916-.086.631 1.953 2.445 3.377 4.604 3.417-1.68 1.319-3.809 2.105-6.102 2.105-.39 0-.779-.023-1.17-.067 2.189 1.394 4.768 2.209 7.557 2.209 9.054 0 14.002-7.496 14.002-13.986 0-.21 0-.423-.015-.634.961-.695 1.8-1.562 2.46-2.549z"/>
          </svg>
          Share on X
        </a>
        <a href={supportUrl} target="_blank" rel="noopener noreferrer" className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center">
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          Support Us
        </a>
        {/* <a href={linkedInUrl} target="_blank" rel="noopener noreferrer" className="bg-blue-700 text-white px-4 py-2 rounded-lg">
          Share on LinkedIn
        </a> */}
      </div>
      {hasContributions ? (
        <div className="flex flex-col w-full max-w-4xl">
          <div className="flex justify-between mb-4">
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
              <option value="star">Star Count</option>
              <option value="latest">Latest PR</option>
              <option value="oldest">Oldest PR</option>
            </select>
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="merged">Merged</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          {finalFilteredPRs.map(([repoName, prs, avatarUrl]) => (
            <div key={repoName} className="p-5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 mb-5 overflow-hidden">
              <div className="flex flex-col items-center text-center">
                <img src={avatarUrl} alt={repoName} className="w-8 h-8 rounded-full mb-2" />
                <h3 className="text-xl font-bold truncate w-full overflow-hidden text-ellipsis">{repoName} 🌟 {formatNumber(prs[0]?.repository.stargazerCount)}</h3>
              </div>
              <br />
              {prs.map((pr) => (
                <div key={pr.url} className="mb-2 flex">
                  <span className="mr-2">•</span>
                  <div>
                    <p className="font-bold">{pr.title}</p>
                    <p>State: {pr.state}</p>
                    <p>Created at: {new Date(pr.createdAt).toLocaleDateString('id-ID')}</p>
                    <a href={pr.url} target="_blank" rel="noopener noreferrer" className="text-blue-500">
                      View Pull Request
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center">this user don't have any open-source contributions yet</p>
      )}
    </main>
  );
}
