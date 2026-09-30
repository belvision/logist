// apps/backend/src/db/seed-documents.ts
import db from './client';
import { document_templates } from './schema/schema';

/**
 * Заполняет базу данных системными шаблонами документов
 */
export async function seedDocumentTemplates() {

  const templates = [
    // ТТН - Товарно-транспортная накладная
    {
      document_type: 'ТТН' as const,
      name: 'Стандартная ТТН',
      description: 'Стандартная форма товарно-транспортной накладной для перевозок по РБ',
      is_system: true,
      is_active: true,
      html_template: `
        <div class="document">
          <div class="header">
            <h1>ТОВАРНО-ТРАНСПОРТНАЯ НАКЛАДНАЯ</h1>
            <p>№ {{document_number}} от {{formatDate document_date}}</p>
          </div>

          <div class="section">
            <h2>Грузоотправитель</h2>
            <p><strong>Название:</strong> {{counterparty_name}}</p>
            {{#if counterparty_unp}}<p><strong>УНП:</strong> {{counterparty_unp}}</p>{{/if}}
            {{#if counterparty_address}}<p><strong>Адрес:</strong> {{counterparty_address}}</p>{{/if}}
          </div>

          <div class="section">
            <h2>Информация о грузе</h2>
            <table>
              <tr>
                <td><strong>Наименование груза:</strong></td>
                <td>{{cargo_name}}</td>
              </tr>
              <tr>
                <td><strong>Вес (тонн):</strong></td>
                <td>{{cargo_weight}}</td>
              </tr>
              <tr>
                <td><strong>Объем (м³):</strong></td>
                <td>{{cargo_volume}}</td>
              </tr>
              {{#if cargo_value}}
              <tr>
                <td><strong>Стоимость:</strong></td>
                <td>{{formatCurrency cargo_value}}</td>
              </tr>
              {{/if}}
            </table>
          </div>

          <div class="section">
            <h2>Маршрут</h2>
            <p><strong>Пункт погрузки:</strong> {{loading_address}}</p>
            <p><strong>Пункт разгрузки:</strong> {{unloading_address}}</p>
          </div>

          <div class="section">
            <h2>Транспортное средство</h2>
            {{#if vehicle_number}}<p><strong>Номер ТС:</strong> {{vehicle_number}}</p>{{/if}}
            {{#if trailer_number}}<p><strong>Номер прицепа:</strong> {{trailer_number}}</p>{{/if}}
            {{#if driver_name}}<p><strong>Водитель:</strong> {{driver_name}}</p>{{/if}}
            {{#if driver_license}}<p><strong>Водительское удостоверение:</strong> {{driver_license}}</p>{{/if}}
          </div>

          <div class="signatures">
            <div class="signature-block">
              <p>Грузоотправитель</p>
              <p>_________________</p>
            </div>
            <div class="signature-block">
              <p>Водитель</p>
              <p>_________________</p>
            </div>
            <div class="signature-block">
              <p>Грузополучатель</p>
              <p>_________________</p>
            </div>
          </div>
        </div>
      `,
      css_styles: `
        .document {
          font-family: 'DejaVu Sans', Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
        }
        .header h1 {
          margin: 0 0 10px 0;
          font-size: 18pt;
        }
        .section {
          margin-bottom: 25px;
        }
        .section h2 {
          font-size: 14pt;
          margin-bottom: 10px;
          color: #333;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        table td {
          padding: 8px;
          border: 1px solid #ddd;
        }
        .signatures {
          display: flex;
          justify-content: space-between;
          margin-top: 50px;
        }
        .signature-block {
          text-align: center;
        }
      `,
      fields: [
        { name: 'cargo_name', label: 'Наименование груза', type: 'text' as const, required: true },
        { name: 'cargo_weight', label: 'Вес (тонн)', type: 'number' as const, required: true },
        { name: 'cargo_volume', label: 'Объем (м³)', type: 'number' as const, required: true },
        { name: 'cargo_value', label: 'Стоимость груза', type: 'number' as const, required: false },
        { name: 'loading_address', label: 'Адрес погрузки', type: 'text' as const, required: true },
        { name: 'unloading_address', label: 'Адрес разгрузки', type: 'text' as const, required: true },
        { name: 'vehicle_number', label: 'Номер ТС', type: 'text' as const, required: false },
        { name: 'trailer_number', label: 'Номер прицепа', type: 'text' as const, required: false },
        { name: 'driver_name', label: 'ФИО водителя', type: 'text' as const, required: false },
        { name: 'driver_license', label: 'Водительское удостоверение', type: 'text' as const, required: false },
      ],
    },

    // CMR - Международная накладная
    {
      document_type: 'CMR' as const,
      name: 'Международная накладная CMR',
      description: 'Стандартная форма международной автомобильной накладной',
      is_system: true,
      is_active: true,
      html_template: `
        <div class="document">
          <div class="header">
            <h1>CONSIGNMENT NOTE / НАКЛАДНАЯ CMR</h1>
            <p>No. {{document_number}} Date: {{formatDate document_date}}</p>
          </div>

          <div class="section">
            <h2>1. Sender / Отправитель</h2>
            <p>{{sender.name}}</p>
            <p>{{sender.address}}</p>
            <p>{{sender.country}}</p>
          </div>

          <div class="section">
            <h2>2. Consignee / Получатель</h2>
            <p>{{consignee.name}}</p>
            <p>{{consignee.address}}</p>
            <p>{{consignee.country}}</p>
          </div>

          <div class="section">
            <h2>3. Place of delivery / Место доставки</h2>
            <p>{{place_of_delivery}}</p>
          </div>

          <div class="section">
            <h2>4. Place of taking over the goods / Место приема груза</h2>
            <p>{{place_of_loading}}</p>
          </div>

          <div class="section">
            <h2>5. Documents attached / Прилагаемые документы</h2>
            <p>{{description}}</p>
          </div>

          <div class="section">
            <h2>6. Carrier / Перевозчик</h2>
            <p>{{carrier.name}}</p>
            <p>{{carrier.address}}</p>
            <p>{{carrier.country}}</p>
          </div>

          <div class="section">
            <h2>7. Goods description / Описание груза</h2>
            <table>
              <tr>
                <td><strong>Description:</strong></td>
                <td>{{cargo_name}}</td>
              </tr>
              <tr>
                <td><strong>Weight (kg):</strong></td>
                <td>{{cargo_weight}}</td>
              </tr>
              <tr>
                <td><strong>Volume (m³):</strong></td>
                <td>{{cargo_volume}}</td>
              </tr>
            </table>
          </div>

          <div class="signatures">
            <div class="signature-block">
              <p>Sender's signature</p>
              <p>_________________</p>
            </div>
            <div class="signature-block">
              <p>Carrier's signature</p>
              <p>_________________</p>
            </div>
            <div class="signature-block">
              <p>Consignee's signature</p>
              <p>_________________</p>
            </div>
          </div>
        </div>
      `,
      css_styles: `
        .document {
          font-family: 'DejaVu Sans', Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border: 2px solid #000;
          padding: 20px;
        }
        .header h1 {
          margin: 0 0 10px 0;
          font-size: 16pt;
        }
        .section {
          margin-bottom: 20px;
          border: 1px solid #000;
          padding: 15px;
        }
        .section h2 {
          font-size: 12pt;
          margin: 0 0 10px 0;
          font-weight: bold;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        table td {
          padding: 8px;
          border: 1px solid #ddd;
        }
        .signatures {
          display: flex;
          justify-content: space-between;
          margin-top: 50px;
        }
        .signature-block {
          text-align: center;
        }
      `,
      fields: [
        { name: 'sender.name', label: 'Отправитель: Название', type: 'text' as const, required: true },
        { name: 'sender.address', label: 'Отправитель: Адрес', type: 'text' as const, required: true },
        { name: 'sender.country', label: 'Отправитель: Страна', type: 'text' as const, required: true },
        { name: 'consignee.name', label: 'Получатель: Название', type: 'text' as const, required: true },
        { name: 'consignee.address', label: 'Получатель: Адрес', type: 'text' as const, required: true },
        { name: 'consignee.country', label: 'Получатель: Страна', type: 'text' as const, required: true },
        { name: 'carrier.name', label: 'Перевозчик: Название', type: 'text' as const, required: true },
        { name: 'carrier.address', label: 'Перевозчик: Адрес', type: 'text' as const, required: true },
        { name: 'carrier.country', label: 'Перевозчик: Страна', type: 'text' as const, required: true },
        { name: 'place_of_loading', label: 'Место приема груза', type: 'text' as const, required: true },
        { name: 'place_of_delivery', label: 'Место доставки', type: 'text' as const, required: true },
        { name: 'cargo_name', label: 'Описание груза', type: 'text' as const, required: true },
        { name: 'cargo_weight', label: 'Вес (кг)', type: 'number' as const, required: true },
        { name: 'cargo_volume', label: 'Объем (м³)', type: 'number' as const, required: true },
      ],
    },

    // Договор перевозки
    {
      document_type: 'Договор' as const,
      name: 'Договор перевозки груза',
      description: 'Стандартный договор на перевозку груза автомобильным транспортом',
      is_system: true,
      is_active: true,
      html_template: `
        <div class="document">
          <div class="header">
            <h1>ДОГОВОР ПЕРЕВОЗКИ ГРУЗА</h1>
            <p>№ {{contract_number}} от {{formatDate contract_date}}</p>
          </div>

          <div class="section">
            <p>Настоящий договор заключен между:</p>
            <p><strong>ЗАКАЗЧИК:</strong> {{counterparty_name}}, УНП {{counterparty_unp}}, 
            адрес: {{counterparty_address}}</p>
          </div>

          <div class="section">
            <h2>1. ПРЕДМЕТ ДОГОВОРА</h2>
            <p>Перевозчик обязуется перевезти груз по маршруту, указанному Заказчиком, 
            а Заказчик обязуется оплатить услуги по перевозке.</p>
          </div>

          <div class="section">
            <h2>2. ХАРАКТЕРИСТИКИ ГРУЗА</h2>
            <table>
              <tr>
                <td><strong>Наименование:</strong></td>
                <td>{{cargo_name}}</td>
              </tr>
              <tr>
                <td><strong>Вес:</strong></td>
                <td>{{cargo_weight}} тонн</td>
              </tr>
              <tr>
                <td><strong>Объем:</strong></td>
                <td>{{cargo_volume}} м³</td>
              </tr>
            </table>
          </div>

          <div class="section">
            <h2>3. МАРШРУТ ПЕРЕВОЗКИ</h2>
            <p><strong>Пункт отправления:</strong> {{loading_address}}</p>
            <p><strong>Пункт назначения:</strong> {{unloading_address}}</p>
          </div>

          <div class="section">
            <h2>4. СТОИМОСТЬ УСЛУГ</h2>
            <p>Стоимость перевозки составляет: {{formatCurrency price}}</p>
            {{#if payment_terms}}<p><strong>Условия оплаты:</strong> {{payment_terms}}</p>{{/if}}
            {{#if delivery_terms}}<p><strong>Условия доставки:</strong> {{delivery_terms}}</p>{{/if}}
          </div>

          <div class="section">
            <h2>5. ОТВЕТСТВЕННОСТЬ СТОРОН</h2>
            <p>Стороны несут ответственность за невыполнение или ненадлежащее выполнение 
            своих обязательств в соответствии с действующим законодательством.</p>
          </div>

          <div class="signatures">
            <div class="signature-block">
              <p>ЗАКАЗЧИК</p>
              <p>_________________</p>
              <p>{{counterparty_name}}</p>
            </div>
            <div class="signature-block">
              <p>ПЕРЕВОЗЧИК</p>
              <p>_________________</p>
            </div>
          </div>
        </div>
      `,
      css_styles: `
        .document {
          font-family: 'DejaVu Sans', Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          line-height: 1.6;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
        }
        .header h1 {
          margin: 0 0 10px 0;
          font-size: 18pt;
        }
        .section {
          margin-bottom: 25px;
        }
        .section h2 {
          font-size: 14pt;
          margin-bottom: 15px;
          color: #333;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        table td {
          padding: 10px;
          border: 1px solid #ddd;
        }
        .signatures {
          display: flex;
          justify-content: space-between;
          margin-top: 60px;
        }
        .signature-block {
          text-align: center;
          width: 40%;
        }
        .signature-block p:nth-child(2) {
          margin: 30px 0 10px 0;
        }
      `,
      fields: [
        { name: 'contract_number', label: 'Номер договора', type: 'text' as const, required: true },
        { name: 'contract_date', label: 'Дата договора', type: 'date' as const, required: true },
        { name: 'cargo_name', label: 'Наименование груза', type: 'text' as const, required: true },
        { name: 'cargo_weight', label: 'Вес (тонн)', type: 'number' as const, required: true },
        { name: 'cargo_volume', label: 'Объем (м³)', type: 'number' as const, required: true },
        { name: 'loading_address', label: 'Пункт отправления', type: 'text' as const, required: true },
        { name: 'unloading_address', label: 'Пункт назначения', type: 'text' as const, required: true },
        { name: 'price', label: 'Стоимость перевозки', type: 'number' as const, required: true },
        { name: 'payment_terms', label: 'Условия оплаты', type: 'text' as const, required: false },
        { name: 'delivery_terms', label: 'Условия доставки', type: 'text' as const, required: false },
      ],
    },
  ];

  try {
    for (const template of templates) {
      await db.insert(document_templates).values(template).onConflictDoNothing();
    }
  } catch (error) {
    console.error('❌ Error seeding document templates:', error);
    throw error;
  }
}

// Запускаем, если файл выполняется напрямую
if (require.main === module) {
  seedDocumentTemplates()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error('Failed:', err);
      process.exit(1);
    });
}
