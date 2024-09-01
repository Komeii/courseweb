import algoliasearch from "algoliasearch";

const client = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_TEMP_APP_ID!,
  process.env.ALGOLIA_TEMP_API_KEY!,
);
const index = client.initIndex("nthu_courses");

export default index;
