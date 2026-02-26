import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data: categories } = await supabase
        .from('hostel_special_categories')
        .select('id, title');

    console.log('Categories:', categories);

    for (const cat of categories || []) {
        const { count, error } = await supabase
            .from('hostel_product_updates')
            .select('id', { count: 'exact', head: true })
            .contains('special_category_ids', [cat.id]);

        console.log(`Category "${cat.title}" (${cat.id}) has ${count} products.`);
    }
}

check().catch(console.error);
