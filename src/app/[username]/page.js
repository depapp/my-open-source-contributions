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

  const groupedPRs = data.pullRequests.nodes.reduce((acc, pr) => {
    const repoName = pr.repository.nameWithOwner;
    if (!acc[repoName]) {
      acc[repoName] = [];
    }
    acc[repoName].push(pr);
    return acc;
  }, {});

  const sortedPRs = Object.entries(groupedPRs).sort((a, b) => {
    if (sort === 'star') {
      return b[1][0].repository.stargazerCount - a[1][0].repository.stargazerCount;
    } else if (sort === 'latest') {
      return new Date(b[1][0].createdAt) - new Date(a[1][0].createdAt);
    } else if (sort === 'oldest') {
      return new Date(a[1][0].createdAt) - new Date(b[1][0].createdAt);
    }
    return 0;
  });

  const filteredPRs = sortedPRs.map(([repoName, prs]) => {
    return [
      repoName,
      prs.filter(pr => filter === 'all' || pr.state.toLowerCase() === filter)
    ];
  }).filter(([repoName, prs]) => prs.length > 0);

  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-24">
      <h1 className="text-4xl font-bold mb-8 text-center">My Open-Source Contribution on GitHub</h1>
      <div className="flex flex-col items-center mb-8">
        <img src={data.avatarUrl} alt={data.login} className="rounded-full w-24 h-24 mb-4" />
        <h2 className="text-2xl">{data.name}</h2>
        <a href={`https://github.com/${data.login}`} target="_blank" rel="noopener noreferrer" className="text-blue-500">
          @{data.login}
        </a>
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
          {filteredPRs.map(([repoName, prs]) => (
            <div key={repoName} className="p-5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 mb-5 overflow-hidden">
              <h3 className="text-xl font-bold text-center truncate">{repoName} 🌟 {formatNumber(prs[0]?.repository.stargazerCount)}</h3><br />
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
