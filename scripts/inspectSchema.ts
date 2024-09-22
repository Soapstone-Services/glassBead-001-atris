import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_PRIVATE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function inspectSchema() {
  try {
    const { data, error } = await supabase.rpc('inspect_schema')

    if (error) throw error

    if (data && data.length > 0) {
      console.log('Tables in your database:')
      let currentTable = ''
      for (const row of data) {
        if (row.table_name !== currentTable) {
          if (currentTable !== '') console.log() // Add a newline between tables
          console.log(`- ${row.table_name}`)
          currentTable = row.table_name
        }
        console.log(`  - ${row.column_name} (${row.data_type}, ${row.is_nullable === 'YES' ? 'nullable' : 'not nullable'})`)
      }
    } else {
      console.log('No tables found in the database.')
    }
  } catch (error) {
    console.error('Error inspecting schema:', error)
  }
}

inspectSchema()
