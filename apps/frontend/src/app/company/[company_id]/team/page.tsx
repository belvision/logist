"use client";

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TeamMemberCard } from '@/components/team/TeamMemberCard';
import { AddMemberModal } from '@/components/team/AddMemberModal';
import { EditMemberModal } from '@/components/team/EditMemberModal';
import { DeleteConfirmationModal } from '@/components/team/DeleteConfirmationModal';
import TeamPagination from '@/components/team/TeamPagination';
import { getCompanyUsers, removeUserFromCompany } from '@/shared/api/company';
import { CompanyUser, getTeamStats } from '@/types/company';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { handleApiError } from '@/lib/toast';

export default function TeamPage() {
  const [teamMembers, setTeamMembers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<CompanyUser | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Состояние для пагинации
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false
  });

  const params = useParams();
  const companyId = params['company_id'];

  // Загрузка данных команды
  const loadTeamData = useCallback(async (page = 1) => {
    if (!companyId || Array.isArray(companyId)) return;

    try {
      setLoading(true);

      const response = await getCompanyUsers(companyId, {
        page,
        limit: pagination.limit
      });

      // Обрабатываем ответ API
      console.log('API Response:', response); // Для отладки
      
      if (response && response.data && response.data.users) {
        // Новая структура API ответа
        setTeamMembers(response.data.users as CompanyUser[]);
        setPagination(prev => ({
          ...prev,
          page: response.data.pagination.page || page,
          total: response.data.pagination.total || 0,
          pages: response.data.pagination.pages || Math.ceil((response.data.pagination.total || 0) / (response.data.pagination.limit || pagination.limit)),
          hasNext: response.data.pagination.hasNext || false,
          hasPrev: response.data.pagination.hasPrev || false
        }));
      } else if (response && response.users) {
        // Старая структура API ответа (для совместимости)
        setTeamMembers(response.users as CompanyUser[]);
        setPagination(prev => ({
          ...prev,
          page: response.page || page,
          total: response.total || 0,
          pages: Math.ceil((response.total || 0) / (response.limit || pagination.limit)),
          hasNext: (response.page || page) < Math.ceil((response.total || 0) / (response.limit || pagination.limit)),
          hasPrev: (response.page || page) > 1
        }));
      } else {
        console.warn('Unexpected API response structure:', response);
        setTeamMembers([]);
      }
    } catch (error) {
      handleApiError(error, 'Ошибка загрузки команды');
      setTeamMembers([]);
    } finally {
      setLoading(false);
    }
  }, [companyId, pagination.limit]);

  useEffect(() => {
    if (companyId && !Array.isArray(companyId)) {
      loadTeamData(1);
    }
  }, [companyId, loadTeamData]);

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
    // Принудительно обновляем список команды
    setLoading(true);
    loadTeamData(1); // Загружаем первую страницу
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
    if (!selectedMember || !companyId || Array.isArray(companyId)) return;

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
  
  // Подсчитываем сотрудников без владельцев для отображения в "Всего сотрудников"
  const employeesCount = teamMembers.filter(member => member.role !== 'Владелец').length;

  if (!companyId || Array.isArray(companyId)) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Company ID not found</div>
        </div>
      </AppLayout>
    );
  }

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Команда</h1>
          <Button onClick={handleAddMember} size="sm" className='bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'>
            Добавить сотрудника
          </Button>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{employeesCount}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Всего сотрудников</div>
            </div>
          </Card>
          <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.owners}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Владельцы</div>
            </div>
          </Card>
          <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.admins}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Администраторы</div>
            </div>
          </Card>
          <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.users}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Пользователи</div>
            </div>
          </Card>
        </div>

        {/* Список команды */}
        {teamMembers.length === 0 ? (
          <Card className="p-8 text-center bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="text-gray-500 dark:text-gray-400">
              В команде пока нет сотрудников
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
              total={employeesCount}
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

