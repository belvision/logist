import { SocialCargoRepository } from './social-cargo.repository';
import type { SocialCargoFilter } from './social-cargo.types';
import db from '../../db/client';
import { cargo_messendger, report } from '../../db/schema/schema';
import { eq, sql, and } from 'drizzle-orm';

export class SocialCargoService {
  private repository: SocialCargoRepository;

  constructor() {
    this.repository = new SocialCargoRepository();
  }

  async getSocialCargos(filter: SocialCargoFilter, userId?: string) {
    return this.repository.getSocialCargos(filter, userId);
  }

  async markAsIrrelevant(cargoId: number, userId: string) {
    
    // Проверяем, не отметил ли уже пользователь этот груз
    const existingReport = await db
      .select()
      .from(report)
      .where(
        and(
          eq(report.id_cargo, cargoId),
          eq(report.id_user, userId)
        )
      )
      .limit(1);

    if (existingReport.length > 0) {
      return { success: false, error: 'Груз уже отмечен как неактуальный' };
    }

    // Создаем запись в таблице report
    const reportResult = await db.insert(report).values({
      id_cargo: cargoId,
      id_user: userId,
    }).returning({
      id: report.id,
      id_cargo: report.id_cargo,
      id_user: report.id_user,
    });
    
    // Увеличиваем счетчик irrelevant в cargo_messendger
    const [updatedCargo] = await db
      .update(cargo_messendger)
      .set({
        irrelevant: sql`${cargo_messendger.irrelevant} + 1`,
      })
      .where(eq(cargo_messendger.id_cargo, cargoId))
      .returning();

    return {
      success: true,
      data: {
        id_cargo: cargoId,
        irrelevant: updatedCargo.irrelevant,
      },
    };
  }
}
