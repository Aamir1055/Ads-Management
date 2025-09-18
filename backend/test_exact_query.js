const mysql = require('mysql2/promise');
const config = { host: 'localhost', user: 'root', password: '', database: 'ads reporting' };

const toMysqlDate = (val) => {
  if (!val) return null;
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return null;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

(async () => {
  try {
    const connection = await mysql.createConnection(config);
    console.log('🔍 Testing exact SQL query from backend...\n');
    
    // Get date range from campaign_data
    const [dateRange] = await connection.query('SELECT MIN(data_date) as min_date, MAX(data_date) as max_date FROM campaign_data');
    const startDate = toMysqlDate(dateRange[0]?.min_date);
    const endDate = toMysqlDate(dateRange[0]?.max_date);
    
    console.log('Date range:', startDate, 'to', endDate);
    
    const where = [];
    const params = [];
    
    // Date range filter
    where.push('cd.data_date >= ?', 'cd.data_date <= ?');
    params.push(startDate, endDate);
    
    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
    
    // This is the exact query from the backend controller
    const reportSql = `
      SELECT
        cd.id,
        cd.data_date as report_date,
        DATE_FORMAT(cd.data_date, '%Y-%m') as report_month,
        cd.campaign_id,
        c.name as campaign_name,
        ct.type_name as campaign_type,
        COALESCE(b.name, 'Unknown Brand') as brand,
        c.brand as brand_id,
        cd.facebook_result,
        cd.xoho_result as zoho_result,
        (cd.facebook_result + cd.xoho_result) as leads,
        cd.spent,
        cd.card_id,
        cd.card_name,
        CASE 
          WHEN (cd.facebook_result + cd.xoho_result) > 0 
          THEN cd.spent / (cd.facebook_result + cd.xoho_result)
          ELSE NULL 
        END as cost_per_lead,
        cd.created_at,
        cd.updated_at
      FROM campaign_data cd
      LEFT JOIN campaigns c ON cd.campaign_id = c.id
      LEFT JOIN campaign_types ct ON c.campaign_type_id = ct.id
      LEFT JOIN brands b ON c.brand = b.id
      ${whereClause}
      ORDER BY cd.data_date DESC, cd.id DESC
    `;
    
    console.log('Executing SQL query:');
    console.log(reportSql);
    console.log('With params:', params);
    console.log('\n=== Query Results ===');
    
    const [results] = await connection.query(reportSql, params);
    
    console.log('Total results:', results.length);
    
    if (results.length > 0) {
      console.log('\n🔍 First 3 records:');
      results.slice(0, 3).forEach((record, idx) => {
        console.log(`\nRecord ${idx + 1}:`);
        console.log('  ID:', record.id);
        console.log('  Campaign:', record.campaign_name);
        console.log('  Brand field:', `"${record.brand}" (type: ${typeof record.brand})`);
        console.log('  Brand ID field:', record.brand_id, '(type:', typeof record.brand_id, ')');
        console.log('  Facebook:', record.facebook_result);
        console.log('  Zoho:', record.zoho_result);
        console.log('  Leads:', record.leads, '(type:', typeof record.leads, ')');
        console.log('  Spent:', record.spent);
        console.log('  Cost per lead:', record.cost_per_lead, '(type:', typeof record.cost_per_lead, ')');
        console.log('  Report date:', record.report_date);
      });
      
      // Check brand field types
      const brandTypes = results.map(r => typeof r.brand).filter((type, idx, arr) => arr.indexOf(type) === idx);
      console.log('\n🧐 Brand field types found:', brandTypes);
      
      const numericBrands = results.filter(r => typeof r.brand === 'number');
      if (numericBrands.length > 0) {
        console.log('\n❌ Found numeric brand values - PROBLEM CONFIRMED!');
      } else {
        console.log('\n✅ All brand values are strings - PROBLEM FIXED!');
      }
    }
    
    await connection.end();
    
  } catch (error) {
    console.error('Error:', error);
  }
})();
