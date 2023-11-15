import supabase_server from "@/config/supabase_server"
import { getCourse } from "@/lib/course";
import { Table } from "@mui/joy";

const getSubmissionDetails = async (courseId: string) => {
    // TODO: Authentication is not implemented yet so this must not be public
    return [];
    const { data, error } = await supabase_server
        .from('cds_submissions')
        .select('*')
        .contains('selections', [courseId])

    if (error) {
        console.log(error);
        throw error;
    }

    
    return data;
}

const CourseSubmissions = async ({ params: { courseId } }: { params: { courseId: string }}) => {
    const submissions = await getSubmissionDetails(decodeURI(courseId));
    const course = await getCourse(decodeURI(courseId));

    return (
        <div className='w-full h-full overflow-y-auto'>
            <h1 className="text-2xl font-bold mb-3 sticky top-0">選擇 {course?.department} {course?.course}-{course?.class} {course?.name_zh} 名單</h1>
            <div className="w-full h-full overflow-y-auto">
                <Table className="w-full">
                    <thead>
                        <tr>
                            <th>學號</th>
                            <th>姓名</th>
                            <th>Email</th>
                        </tr>
                    </thead>
                    <tbody>
                        {submissions.map((submission) => (
                            <tr key={submission.id}>
                                <td>{submission.user_id}</td>
                                <td>{submission.name_zh}</td>
                                <td>{submission.email}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>
        </div>
    )
}

export default CourseSubmissions