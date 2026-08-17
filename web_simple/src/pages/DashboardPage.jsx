/**
 * Dashboard page component - DesignStitch My Documents design
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { documentAPI } from '../services/api';
import { useAuthStore } from '../state/authStore';
import Button from '../components/design-system/Button';
import DataTable from '../components/design-system/DataTable';
import StatusBadge from '../components/design-system/StatusBadge';

function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const { data: documents, isLoading, error } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const response = await documentAPI.list();
      return response.data;
    },
  });

  const columns = [
    {
      key: 'id',
      label: 'ID',
      width: 'w-32',
      render: (value) => (
        <span className="text-code-md font-code-md text-outline">{value}</span>
      )
    },
    {
      key: 'title',
      label: 'Title',
      render: (value, row) => (
        <span className="text-primary font-medium group-hover:text-secondary
                       transition-colors">
          {value}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      width: 'w-40',
      render: (value) => {
        const variant = value === 'Published' ? 'published' : 'draft';
        return <StatusBadge status={value} variant={variant} />;
      }
    },
    {
      key: 'created_date',
      label: 'Created Date',
      width: 'w-48 hidden sm:table-cell',
      render: (value) => (
        <span className="text-on-surface-variant">{value}</span>
      )
    },
    {
      key: 'actions',
      label: '',
      width: 'w-16',
      render: (_, row) => (
        <button className="text-outline hover:text-secondary opacity-0
                           group-hover:opacity-100 transition-all">
          <span className="material-symbols-outlined">more_vert</span>
        </button>
      )
    }
  ];

  const handleRowClick = (row) => {
    navigate(`/prd/${row.id}`);
  };

  const handleNewPRD = () => {
    navigate('/prd/new');
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-error mb-md">Failed to load documents</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between
                      mb-xl gap-md">
        <div>
          <h1 className="text-headline-lg font-headline-lg text-primary">
            My Documents
          </h1>
          <p className="text-body-sm font-body-sm text-on-surface-variant mt-xs">
            Connected as: <span className="font-code-md text-code-md text-secondary">
              {user?.email || 'Loading...'}
            </span>
          </p>
        </div>
        <Button
          variant="primary"
          icon="add"
          onClick={handleNewPRD}
        >
          New PRD
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={documents || []}
        onRowClick={handleRowClick}
        loading={isLoading}
      />
    </div>
  );
}

export default DashboardPage;
