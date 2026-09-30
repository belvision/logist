"use client";

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
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
import { Plus } from 'lucide-react';

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
      
      if (response && response.data && response.data.users) {
        // Новая структура API ответа
        if (response.data) {
          const data = response.data;
          setTeamMembers(data.users as CompanyUser[]);
          setPagination(prev => ({
            ...prev,
            page: data.pagination.page || page,
            total: data.pagination.total || 0,
            pages: data.pagination.pages || Math.ceil((data.pagination.total || 0) / (data.pagination.limit || pagination.limit)),
            hasNext: data.pagination.hasNext || false,
            hasPrev: data.pagination.hasPrev || false
          }));
        }
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
  // const handleAddMember = () => {
  //   setShowAddModal(true);
  // };

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
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Команда</h1>
          <button
            onClick={() => {
              // setFormData({ email: "", role: "Пользователь" });
              setShowAddModal(!showAddModal);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Добавить сотрудника
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-4 gap-6">
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <p className="text-3xl font-bold text-foreground">{stats.total}</p>
            <p className="text-sm text-muted-foreground mt-2">Всего сотрудников</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <p className="text-3xl font-bold text-foreground">{stats.owners}</p>
            <p className="text-sm text-muted-foreground mt-2">Владельцы</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <p className="text-3xl font-bold text-foreground">{stats.admins}</p>
            <p className="text-sm text-muted-foreground mt-2">Администраторы</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <p className="text-3xl font-bold text-foreground">{stats.users}</p>
            <p className="text-sm text-muted-foreground mt-2">Пользователи</p>
          </div>
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
