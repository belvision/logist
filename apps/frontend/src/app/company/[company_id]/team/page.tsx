"use client";

import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TeamMemberCard } from '@/components/team/TeamMemberCard';
import { AddMemberModal } from '@/components/team/AddMemberModal';
import { EditMemberModal } from '@/components/team/EditMemberModal';
import { DeleteConfirmationModal } from '@/components/team/DeleteConfirmationModal';
import { getCompanyUsers, removeUserFromCompany } from '@/shared/api/company';
import { CompanyUser, getTeamStats } from '@/types/company';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { showToast, handleApiError } from '@/lib/toast';

export default function TeamPage() {
  const [teamMembers, setTeamMembers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<CompanyUser | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const params = useParams();
  const companyId = params.company_id as string;

  // Загрузка данных команды
  useEffect(() => {
    const loadTeamData = async () => {
      try {
        setLoading(true);
        const response = await getCompanyUsers(companyId);
        if (response.users) {
          setTeamMembers(response.users);
        }
      } catch (error) {
        handleApiError(error, 'Ошибка загрузки команды');
        setTeamMembers([]);
      } finally {
        setLoading(false);
      }
    };

    loadTeamData();
  }, [companyId]);

  // Фильтрация команды
  const filteredMembers = teamMembers.filter(member => {
    const matchesRole = filterRole === 'all' || member.role === filterRole;
    const matchesStatus = filterStatus === 'all' || (filterStatus === 'active' ? member.isActive : !member.isActive);
    const matchesSearch = member.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (member.firstName && member.firstName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (member.lastName && member.lastName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesRole && matchesStatus && matchesSearch;
  });

  // Обработчики действий
  const handleAddMember = () => {
    setShowAddModal(true);
  };

  const handleEditMember = (member: CompanyUser) => {
    setSelectedMember(member);
    setShowEditModal(true);
  };

  const handleAddSuccess = () => {
    // Перезагрузить данные команды
    const loadTeamData = async () => {
      try {
        setLoading(true);
        const response = await getCompanyUsers(companyId);
        if (response.users) {
          setTeamMembers(response.users);
        }
      } catch (error) {
        handleApiError(error, 'Ошибка загрузки команды');
        setTeamMembers([]);
      } finally {
        setLoading(false);
      }
    };
    loadTeamData();
  };

  const handleEditSuccess = () => {
    // Перезагрузить данные команды
    const loadTeamData = async () => {
      try {
        setLoading(true);
        const response = await getCompanyUsers(companyId);
        if (response.users) {
          setTeamMembers(response.users);
        }
      } catch (error) {
        handleApiError(error, 'Ошибка загрузки команды');
        setTeamMembers([]);
      } finally {
        setLoading(false);
      }
    };
    loadTeamData();
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

        {/* TODO: Фильтры и поиск после реализации на бэкенде */}
        {/* <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">

            <div className="flex-1">
              <input
                type="text"
                placeholder="Поиск по имени, username или email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            

            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Все роли</option>
              <option value="Владелец">Владельцы</option>
              <option value="Администратор">Администраторы</option>
              <option value="Пользователь">Пользователи</option>
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Все статусы</option>
              <option value="active">Активные</option>
              <option value="inactive">Неактивные</option>
            </select>
          </div>
        </Card> */}

        {/* Список команды */}
        {filteredMembers.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-gray-500">
              {searchQuery || filterRole !== 'all' || filterStatus !== 'all' 
                ? 'Сотрудники не найдены по заданным фильтрам'
                : 'В команде пока нет сотрудников'
              }
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMembers.map((member) => (
              <TeamMemberCard
                key={member.id_user}
                member={member}
                onEdit={handleEditMember}
                onDelete={(id) => handleDeleteMember(id)}
              />
            ))}
          </div>
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