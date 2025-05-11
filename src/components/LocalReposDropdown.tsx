import React, { useState, useEffect } from 'react';
import { FaDatabase, FaFolder, FaSync } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

// Define interface for project data from API
interface ProjectData {
  id: string;
  name: string;
  path: string;
  repoPath: string | null;
  repoUrl: string | null;
  fileCount: number;
  submittedAt: number;
}

// Props for the component
interface LocalReposDropdownProps {
  t: (key: string, params?: Record<string, string | number>) => string;
}

export default function LocalReposDropdown({ t }: LocalReposDropdownProps) {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Call the API endpoint with the constant API base URL
      const response = await fetch(`/api/projects`);
      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.status}`);
      }

      const data = await response.json();
      setProjects(data);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Format date for display
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  // Handle repository selection
  const handleSelectRepo = (project: ProjectData) => {
    // Use GitHub-like format for the URL
    const repoSegment = project.repoUrl ? 
      // Extract owner/repo from the URL if available
      extractOwnerRepoFromUrl(project.repoUrl) : 
      // Otherwise use the name of the repo as is
      `local/${project.id}`;
    
    router.push(`/${repoSegment}`);
  };

  // Helper function to extract owner/repo from URL
  const extractOwnerRepoFromUrl = (url: string): string => {
    // GitHub URL format: https://github.com/owner/repo
    if (url.includes('github.com')) {
      const parts = url.replace(/https?:\/\/github\.com\//, '').split('/');
      return `${parts[0]}/${parts[1]}`;
    }
    // GitLab URL format: https://gitlab.com/owner/repo
    else if (url.includes('gitlab.com')) {
      const parts = url.replace(/https?:\/\/gitlab\.com\//, '').split('/');
      // Handle potentially nested group/repo structures
      return parts.length > 1 ? `${parts[0]}/${parts[parts.length - 1]}` : parts.join('/');
    }
    // Bitbucket URL format: https://bitbucket.org/owner/repo
    else if (url.includes('bitbucket.org')) {
      const parts = url.replace(/https?:\/\/bitbucket\.org\//, '').split('/');
      return `${parts[0]}/${parts[1]}`;
    }
    // Fallback
    return `local/${url.split('/').pop() || 'repo'}`;
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProjects();
  };

  return (
    <div className="w-full border border-[var(--border-color)] rounded-lg shadow-sm card-japanese overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-[var(--border-color)] bg-[var(--card-bg)]">
        <div className="flex items-center gap-2">
          <FaDatabase className="text-[var(--accent-primary)]" />
          <h3 className="text-sm font-medium">{t('home.localRepos')}</h3>
        </div>
        <button 
          onClick={handleRefresh} 
          className="p-1.5 rounded hover:bg-[var(--background)]/70 text-[var(--muted)] hover:text-[var(--accent-primary)] transition-colors"
          disabled={refreshing || isLoading}
        >
          <FaSync className={`text-xs ${refreshing ? 'animate-spin' : ''}`} />
          <span className="sr-only">{t('common.refresh')}</span>
        </button>
      </div>
      
      <div className="px-4 py-2 bg-[var(--background)]/30 border-b border-[var(--border-color)] text-xs text-[var(--muted)]">
        {t('home.localReposDescription')}
      </div>

      <div className="overflow-y-auto max-h-56">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--accent-primary)]"></div>
          </div>
        ) : error ? (
          <div className="p-4 text-sm text-[var(--highlight)] text-center">
            {error}
          </div>
        ) : projects.length === 0 ? (
          <div className="p-6 text-sm text-[var(--muted)] text-center">
            {t('home.noLocalRepos')}
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border-color)]">
            {projects.map((project) => (
              <li key={project.id}>
                <button
                  onClick={() => handleSelectRepo(project)}
                  className="w-full text-left px-4 py-3 hover:bg-[var(--background)]/50 transition-colors flex items-start gap-3"
                >
                  <FaFolder className="text-[var(--accent-primary)] mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{project.name}</div>
                    {project.repoUrl && (
                      <div className="text-xs text-[var(--muted)] truncate mt-0.5">
                        {project.repoUrl}
                      </div>
                    )}
                    <div className="text-xs text-[var(--muted)] mt-1 flex items-center justify-between">
                      <span>{project.fileCount} {t('home.files')}</span>
                      <span>{formatDate(project.submittedAt)}</span>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 