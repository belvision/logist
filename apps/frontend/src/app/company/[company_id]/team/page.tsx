"use client";

import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TeamMemberCard } from '@/components/team/TeamMemberCard';
import { AddMemberModal } from '@/components/team/AddMemberModal';
import { EditMemberModal } from '@/components/team/EditMemberModal';
import { DeleteConfirmationModal } from '@/components/team/DeleteConfirmationModal';
import TeamFilters from '@/components/team/TeamFilters';
import TeamPagination from '@/components/team/TeamPagination';
import { getCompanyUsers, removeUserFromCompany } from '@/shared/api/company';
import { CompanyUser, getTeamStats } from '@/types/company';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { showToast, handleApiError } from '@/lib/toast';

export default function TeamPage() {
  const [teamMembers, setTeamMembers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<CompanyUser | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Состояние для фильтрации и пагинации
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    status: '',
    sortBy: 'name',
    sortOrder: 'asc'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false
  });
  
  const params = useParams();
  const companyId = params.company_id as string;

  // Загрузка данных команды
  const loadTeamData = async (page = 1) => {
    try {
      setLoading(true);
      
      const response = await getCompanyUsers(companyId, {
        page,
        limit: pagination.limit,
        ...filters
      });
      
      // Поддерживаем как старый, так и новый формат ответа
      if (response.success && response.data) {
        // Новый формат с пагинацией
        setTeamMembers(response.data.users || []);
        setPagination(response.data.pagination || pagination);
      } else if (response.users) {
        // Старый формат без пагинации
        setTeamMembers(response.users || []);
      } else {
        setTeamMembers([]);
      }
    } catch (error) {
      handleApiError(error, 'Ошибка загрузки команды');
      setTeamMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeamData(1);
  }, [companyId]);

  // Перезагрузка при изменении фильтров
  useEffect(() => {
    loadTeamData(1);
  }, [filters]);

  // Обработчики фильтров
  const handleFiltersChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const handleFiltersReset = () => {
    setFilters({
      search: '',
      role: '',
      status: '',
      sortBy: 'name',
      sortOrder: 'asc'
    });
  };

  // Обработчик смены страницы
  const handlePageChange = (page: number) => {
    loadTeamData(page);
  };

  // Обработчики действий
  const handleAddMember = () => {
    setShowAddModal(true);
  };

  const handleEditMember = (member: CompanyUser) => {
    setSelectedMember(member);
    setShowEditModal(true);
  };

  const handleAddSuccess = () => {
    loadTeamData(pagination.page);
  };

  const handleEditSuccess = () => {
    loadTeamData(pagination.page);
  };

  const handleDeleteMember = (memberId: string) => {
    const member = teamMembers.find(m => m.id_user === memberId);
    if (member) {
      setSelectedMember(member);
      setShowDeleteModal(true);
    }
  };

  const confirmDeleteMember = async () => {
    if (!selectedMember) return;

    setDeleteLoading(true);
    try {
      await removeUserFromCompany(companyId, selectedMember.id_user);
      setTeamMembers(prev => prev.filter(member => member.id_user !== selectedMember.id_user));
      setShowDeleteModal(false);
      setSelectedMember(null);
    } catch (error) {
      handleApiError(error, 'Ошибка удаления пользователя');
    } finally {
      setDeleteLoading(false);
    }
  };


  const stats = getTeamStats(teamMembers);

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-gray-600">Загрузка команды...</div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Заголовок и кнопка добавления */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Команда</h1>
          <Button onClick={handleAddMember} size="sm" className='bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'>
            Добавить сотрудника
          </Button>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Всего сотрудников</div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.owners}</div>
              <div className="text-sm text-gray-600">Владельцы</div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.admins}</div>
              <div className="text-sm text-gray-600">Администраторы</div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.users}</div>
              <div className="text-sm text-gray-600">Пользователи</div>
            </div>
          </Card>
        </div>

        {/* Фильтры */}
        <TeamFilters
          onFiltersChange={handleFiltersChange}
          onReset={handleFiltersReset}
        />

        {/* Список команды */}
        {teamMembers.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-gray-500">
              {filters.search || filters.role || filters.status
                ? 'Сотрудники не найдены по заданным фильтрам'
                : 'В команде пока нет сотрудников'
              }
            </div>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teamMembers.map((member) => (
                <TeamMemberCard
                  key={member.id_user}
                  member={member}
                  onEdit={handleEditMember}
                  onDelete={(id) => handleDeleteMember(id)}
                />
              ))}
            </div>
            
            {/* Пагинация */}
            <TeamPagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              onPageChange={handlePageChange}
              hasNext={pagination.hasNext}
              hasPrev={pagination.hasPrev}
              total={pagination.total}
              limit={pagination.limit}
            />
          </>
        )}
      </div>

      {/* Модальные окна */}
      <AddMemberModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddSuccess}
        companyId={companyId}
      />

      <EditMemberModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedMember(null);
        }}
        onSuccess={handleEditSuccess}
        member={selectedMember}
        companyId={companyId}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedMember(null);
        }}
        onConfirm={confirmDeleteMember}
        member={selectedMember}
        loading={deleteLoading}
      />
    </AppLayout>
  );
}