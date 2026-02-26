import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase
        .from('hostel_product_updates')
        .select('status');

    if (error) {
        console.error(error);
        return;
    }

    const counts = data.reduce((acc: any, curr: any) => {
        const s = curr.status || 'NULL';
        acc[s] = (acc[s] || 0) + 1;
        return acc;
    }, {});

    console.log('Status counts:', counts);

    // Also check if there are any products at all
    console.log('Total products:', data.length);
}

check().catch(console.error);
