'use client';

import React, { useState, useEffect } from 'react';
import { messengerApi, type CreateConversationRequest } from '../../shared/api/messengerApi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../ui/dialog';
import { MessageSquare, Search, User, X, Loader2, UserPlus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui';
import { Badge } from '../ui/badge';

interface User {
  id_user: string;
  username: string;
  firstName?: string;
  lastName?: string;
  company?: {
    id_company: string;
    name_company: string;
  };
}

interface CreateConversationDialogProps {
  onConversationCreated: (conversationId: string) => void;
  trigger?: React.ReactNode;
}

export const CreateConversationDialog: React.FC<CreateConversationDialogProps> = ({
  onConversationCreated,
  trigger
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [relatedCargoId, setRelatedCargoId] = useState<string>('');
  const [relatedRouteId, setRelatedRouteId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (open) {
      loadUsers();
    }
  }, [open]);

  useEffect(() => {
    if (searchQuery) {
      searchUsers();
    } else {
      setUsers([]);
    }
  }, [searchQuery]);

  const loadUsers = async () => {
    // В реальном приложении здесь должен быть API для получения списка пользователей
    // Пока что используем моковые данные
    setUsers([]);
  };

  const searchUsers = async () => {
    try {
      setLoading(true);
      // В реальном приложении здесь должен быть API для поиска пользователей
      // Пока что используем моковые данные
      const mockUsers: User[] = [
        {
          id_user: '1',
          username: 'ivanov_ivan',
          firstName: 'Иван',
          lastName: 'Иванов',
          company: {
            id_company: 'comp1',
            name_company: 'ООО "Транспорт"'
          }
        },
        {
          id_user: '2',
          username: 'petrov_petr',
          firstName: 'Петр',
          lastName: 'Петров',
          company: {
            id_company: 'comp2',
            name_company: 'ИП Петров'
          }
        }
      ];
      
      const filteredUsers = mockUsers.filter(user =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.company?.name_company.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConversation = async () => {
    if (!selectedUser) return;

    try {
      setCreating(true);
      
      const request: CreateConversationRequest = {
        userId: selectedUser.id_user,
        ...(relatedCargoId && { relatedCargoId: parseInt(relatedCargoId) }),
        ...(relatedRouteId && { relatedRouteId: parseInt(relatedRouteId) }),
      };

      const conversation = await messengerApi.createConversation(request);
      
      onConversationCreated(conversation.id_conversation);
      setOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create conversation:', error);
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setSearchQuery('');
    setSelectedUser(null);
    setRelatedCargoId('');
    setRelatedRouteId('');
    setUsers([]);
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setSearchQuery('');
    setUsers([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2 bg-primary hover:bg-primary/90 shadow-lg hover:shadow-primary/20 transition-all">
            <UserPlus className="h-4 w-4" />
            Новая беседа
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-lg bg-card/95 backdrop-blur-sm border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-primary/10 rounded-xl">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            Начать новую беседу
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Найдите пользователя и начните общение
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Поиск пользователя */}
          {!selectedUser && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Поиск по имени, компании..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 text-base bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 rounded-xl"
                  autoFocus
                />
              </div>
              
              {/* Список найденных пользователей */}
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
                    <Loader2 className="relative h-8 w-8 animate-spin text-primary" />
                  </div>
                </div>
              )}
              
              {!loading && users.length > 0 && (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                  {users.map((user) => (
                    <div
                      key={user.id_user}
                      className="flex items-center gap-3 p-3 rounded-xl border-2 border-border/50 hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all duration-200 group"
                      onClick={() => handleUserSelect(user)}
                    >
                      <Avatar className="h-12 w-12 border-2 border-border/30 shadow-sm group-hover:border-primary/30 transition-colors">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-semibold">
                          {user.firstName?.[0] || user.username[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base truncate text-foreground group-hover:text-primary transition-colors">
                          {user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user.username}
                        </p>
                        {user.company && (
                          <p className="text-sm text-muted-foreground truncate flex items-center gap-1.5 mt-0.5">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary"></span>
                            {user.company.name_company}
                          </p>
                        )}
                      </div>
                      <UserPlus className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  ))}
                </div>
              )}
              
              {!loading && searchQuery && users.length === 0 && (
                <div className="text-center py-12">
                  <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-8 inline-block">
                    <User className="h-12 w-12 mx-auto mb-3 text-primary/30" />
                    <p className="font-semibold text-foreground mb-1">Пользователи не найдены</p>
                    <p className="text-sm text-muted-foreground">Попробуйте изменить запрос</p>
                  </div>
                </div>
              )}
              
              {!loading && !searchQuery && (
                <div className="text-center py-12">
                  <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-8 inline-block">
                    <Search className="h-12 w-12 mx-auto mb-3 text-primary/30" />
                    <p className="font-semibold text-foreground mb-1">Начните вводить для поиска</p>
                    <p className="text-sm text-muted-foreground">Имя пользователя или название компании</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Выбранный пользователь */}
          {selectedUser && (
            <div className="space-y-5">
              <div className="flex items-center gap-4 p-4 rounded-2xl border-2 border-primary/50 bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg shadow-primary/5">
                <Avatar className="h-16 w-16 border-2 border-primary/30 shadow-lg">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xl">
                    {selectedUser.firstName?.[0] || selectedUser.username[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <p className="font-bold text-lg text-foreground truncate">
                      {selectedUser.firstName && selectedUser.lastName
                        ? `${selectedUser.firstName} ${selectedUser.lastName}`
                        : selectedUser.username}
                    </p>
                    <Badge variant="secondary" className="text-xs bg-primary/20 text-primary border-primary/30">
                      Выбран
                    </Badge>
                  </div>
                  {selectedUser.company && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary"></span>
                      {selectedUser.company.name_company}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedUser(null)}
                  className="hover:bg-destructive/10 hover:text-destructive transition-colors flex-shrink-0"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Связанные объекты (опционально) */}
              <div className="space-y-3 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-4">
                <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <div className="w-1 h-4 bg-primary rounded-full"></div>
                  Связать с грузом или маршрутом (опционально)
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="ID груза"
                    value={relatedCargoId}
                    onChange={(e) => setRelatedCargoId(e.target.value)}
                    type="number"
                    className="h-11 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 rounded-xl"
                  />
                  <Input
                    placeholder="ID маршрута"
                    value={relatedRouteId}
                    onChange={(e) => setRelatedRouteId(e.target.value)}
                    type="number"
                    className="h-11 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 rounded-xl"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Кнопки */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
            <Button 
              variant="outline" 
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
              className="min-w-28 h-11 rounded-xl border-border/50 hover:bg-card/50 transition-colors"
            >
              Отмена
            </Button>
            <Button
              onClick={handleCreateConversation}
              disabled={!selectedUser || creating}
              className="min-w-36 h-11 gap-2 bg-primary hover:bg-primary/90 shadow-lg hover:shadow-primary/20 transition-all rounded-xl"
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Создание...
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4" />
                  Начать беседу
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
