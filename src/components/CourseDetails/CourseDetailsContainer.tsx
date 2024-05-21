import { format } from "date-fns";
import { ResolvingMetadata } from "next";
import {AlertTriangle, ChevronLeft, CheckCircle, ArrowRight} from 'lucide-react';
import Link from "next/link";
import DownloadSyllabus from "./DownloadSyllabus";
import Fade from "@/components/Animation/Fade";
import { getDictionary } from "@/dictionaries/dictionaries";
import { getCoursePTTReview, getCourseWithSyllabus } from '@/lib/course';
import { LangProps } from "@/types/pages";
import { toPrettySemester } from '@/helpers/semester';
import CourseTagList from "@/components/Courses/CourseTagsList";
import { colorMapFromCourses, createTimetableFromCourses } from "@/helpers/timetable";
import { MinimalCourse } from "@/types/courses";
import { hasTimes, getScoreType, getFormattedClassCode } from '@/helpers/courses';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from "@/components/ui/badge"
import supabase, { CourseDefinition, CourseScoreDefinition } from '@/config/supabase';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { timetableColors } from "@/const/timetableColors";
import dynamicFn from "next/dynamic";
import { Language } from "@/types/settings";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { cn } from "@/lib/utils";

const SelectCourseButtonDynamic = dynamicFn(() => import('@/components/Courses/SelectCourseButton'), { ssr: false });
const TimetableDynamic = dynamicFn(() => import('@/components/Timetable/Timetable'), { ssr: false });
const CommmentsSectionDynamic = dynamicFn(() => import('@/components/CourseDetails/CommentsContainer').then(m => m.CommmentsSection), { ssr: false });


const TOCNavItem = ({ href, children, label, active }: { href: string, children?: React.ReactNode, label: string, active?: boolean }) => {
    return <li className="mt-0 pt-2">
        <a href={href} className={`inline-block no-underline transition-colors hover:text-foreground ${active ? "font-medium text-foreground" : "text-muted-foreground"}`}>{label}</a>
        {children}
    </li>
}

const CrossDisciplineTagList = ({ course }: { course: CourseDefinition }) => {
    return <div className="flex flex-row gap-2 flex-wrap">
        {course.cross_discipline?.map((m, index) => <div key={index} className="flex flex-row items-center justify-center min-w-[65px] space-x-2 px-2 py-2 select-none rounded-md text-sm bg-neutral-200 dark:bg-neutral-800">{m}</div>)}
    </div>
}

const getOtherClasses = async (course: MinimalCourse) => {
    const semester = parseInt(course.semester.substring(0, 3));
    const getsemesters = [semester - 1, semester, semester + 1].map(s => [s.toString() + '10', s.toString() + '20']).flat();

    const { data, error } = await supabase
        .from('courses')
        .select('*, course_scores(*)')
        .eq('department', course.department)
        .eq('course', course.course)
        .eq('name_zh', course.name_zh) //due to the way the course ids are arranged, this is the best way to get the same course
        .in('semester', getsemesters)
        .not('raw_id', 'eq', course.raw_id)
        .order('raw_id', { ascending: false })

    if (error) throw error;
    if (!data) throw new Error('No data');
    return data as unknown as (CourseDefinition & { course_scores: CourseScoreDefinition | undefined })[];
}

const CourseDetailContainer = async ({ lang, courseId, bottomAware = false }: { lang: Language, courseId: string, bottomAware?: boolean }) => {
    const dict = await getDictionary(lang);
    const course = await getCourseWithSyllabus(courseId);

    if (!course) return <div className="py-6 px-4">
        <div className="flex flex-col gap-2 border-l border-neutral-500 pl-4 pr-6">
            <h1 className="text-2xl font-bold">404</h1>
            <p className="text-xl">找不到課程</p>

            <Link href="../">
                <Button size="sm" variant="outline"><ChevronLeft /> Back</Button>
            </Link>
        </div>
    </div>
    const missingSyllabus = course.course_syllabus == null;

    const reviews = await getCoursePTTReview(courseId);
    const otherClasses = await getOtherClasses(course as MinimalCourse);

    // times might not be available, check if it is empty list or its items are all empty strings
    const showTimetable = hasTimes(course as MinimalCourse);

    const colorMap = colorMapFromCourses([course as MinimalCourse].map(c => c.raw_id), timetableColors[Object.keys(timetableColors)[0]]);
    const timetableData = showTimetable ? createTimetableFromCourses([course as MinimalCourse], colorMap) : [];

    return <Fade>
        <div className="flex flex-col pb-6 relative max-w-6xl">
            <div className={cn("flex flex-col gap-4", bottomAware ? 'pb-20 md:pb-0': '')}>
                <div className="flex flex-col md:flex-row md:items-end gap-4">
                    <div className="space-y-4 flex-1 w-full">
                        <div className="space-y-2">
                            <h4 className="font-semibold text-base ">{toPrettySemester(course.semester)} 學期</h4>
                            <h1 className="font-bold text-3xl mb-4 text-nthu-600">{`${course?.department} ${course?.course}-${course?.class}`}</h1>
                            <h2 className="font-semibold text-3xl flex flex-row flex-wrap gap-1">
                                <span>{course!.name_zh}</span>
                                <span className="font-normal">{course?.teacher_zh?.join(',') ?? ""}</span>
                            </h2>
                            <h2 className="font-semibold text-xl flex flex-row flex-wrap gap-1">
                                <span>{course!.name_en}</span>
                                <span className="font-normal">{course?.teacher_en?.join(',') ?? ""}</span>
                            </h2>
                        </div>
                        <CourseTagList course={course} />
                        {course.venues ?
                            course.venues.map((vn, i) => <p key={vn} className='text-blue-600 dark:text-blue-400 text-sm'>{vn} <span className='text-black dark:text-white'>{course.times![i]}</span></p>) :
                            <p>No Venues</p>
                        }
                        <CrossDisciplineTagList course={course} />
                    </div>
                    <div className="hidden md:block absolute top-0 right-0 mt-4 mr-4">
                        <SelectCourseButtonDynamic courseId={course.raw_id} />
                    </div>
                    <div className={cn("md:hidden fixed left-0 pt-2 px-4 shadow-md w-full h-16 flex flex-col bg-background z-50", bottomAware ? 'bottom-20': 'bottom-0')}>
                        <SelectCourseButtonDynamic courseId={course.raw_id} />
                    </div>
                </div>
                <Separator />
                <div className={"flex flex-col-reverse lg:flex-row gap-6 w-full"}>
                    <div className="flex flex-col gap-4 min-w-0 lg:max-w-[calc(100%-284px)]">
                        {!missingSyllabus && <div className="flex flex-col gap-2">
                            <h3 className="font-semibold text-xl" id="brief">{dict.course.details.brief}</h3>
                            <p className="whitespace-pre-line text-sm">{course.course_syllabus.brief}</p>
                        </div>}
                        {!missingSyllabus && <div className="flex flex-col gap-2">
                            <h3 className="font-semibold text-xl" id="description">{dict.course.details.description}</h3>
                            <p className="whitespace-pre-line text-sm">
                                {course.course_syllabus.content ?? <>
                                    <DownloadSyllabus courseId={course.raw_id} />
                                </>}</p>
                        </div>}
                        {course?.prerequisites && <div className="flex flex-col gap-2">
                            <h3 className="font-semibold text-xl" id="prerequesites">{dict.course.details.prerequesites}</h3>
                            <div className="whitespace-pre-line text-sm" dangerouslySetInnerHTML={{ __html: course.prerequisites }} />
                        </div>}
                        {showTimetable && <div className="flex flex-col gap-2">
                            <h3 className="font-semibold text-xl" id="timetable">{dict.course.details.timetable}</h3>
                            <TimetableDynamic timetableData={timetableData} />
                        </div>}
                        {reviews.length > 0 && <div className="flex flex-col gap-2">
                            <h3 className="font-semibold text-xl" id="ptt">{dict.course.details.ptt_title}</h3>
                            <Alert>
                                <AlertTriangle />
                                <AlertDescription>
                                    {dict.course.details.ptt_disclaimer}
                                </AlertDescription>
                            </Alert>
                            <ScrollArea className="w-full whitespace-nowrap">
                                <div className="flex w-max space-x-4 p-4">
                                    {reviews.map((m, index) =>
                                        <Dialog key={index}>
                                            <DialogTrigger asChild>
                                                <Card className="max-w-lg shrink-0">
                                                    <CardHeader>
                                                        <CardTitle>
                                                            {index + 1}. {format(new Date(m.date ?? 0), 'yyyy-MM-dd')} 的心得
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <article className="whitespace-pre-line line-clamp-4 text-sm">{m.content}</article>
                                                    </CardContent>
                                                </Card>
                                            </DialogTrigger>
                                            <DialogContent className="">
                                                <ScrollArea className="max-h-[90vh] whitespace-nowrap">
                                                    <p className="whitespace-pre-line text-sm">{m.content}</p>
                                                </ScrollArea>
                                            </DialogContent>
                                        </Dialog>
                                    )}
                                </div>
                                <ScrollBar orientation="horizontal" />
                            </ScrollArea>
                        </div>}
                        {course.course_scores && <div className="flex flex-col gap-2">
                            <h3 className="font-semibold text-xl" id="scores">{dict.course.details.scores}</h3>
                            {/* TODO: make scores prettier with a graph */}
                            <p>{dict.course.details.average} {dict.course.details.score_types[course.course_scores.type as 'gpa' | 'percent']} {course.course_scores.average}</p>
                            <p>{dict.course.details.standard_deviation} {course.course_scores.std_dev}</p>
                        </div>}
                        <div className="flex flex-col gap-2">
                            <div className="flex flex-row">
                                <h3 className="font-semibold text-xl flex-1" id="other">{dict.course.details.related_courses}</h3>
                                <Button variant="ghost" asChild>
                                    <Link href={`/${lang}/courses?department[0]=${course.department}&textSearch=${course.department + course.course}`}>
                                        查看更多 <ArrowRight className="ml-2 w-4 h-4" />
                                    </Link>
                                </Button>
                            </div>
                            <Table className="table-fixed">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[60px] px-2">學期</TableHead>
                                        <TableHead className="w-[100px] px-2">開課教授</TableHead>
                                        <TableHead className="w-36 px-2">歷年成績</TableHead>
                                        <TableHead className="w-14 p-0"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                {otherClasses.map((m, index) =>
                                    <TableRow key={index}>
                                        <TableCell className="px-2">
                                            <div className="flex flex-col gap-1">
                                                <p>{toPrettySemester(m.semester)}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-2">{m.teacher_zh?.join(',')}</TableCell>
                                        <TableCell>
                                            {m.course_scores && <div className="flex flex-col gap-1 text-sm font-medium text-gray-600 dark:text-neutral-400">
                                                <p>平均{getScoreType(m.course_scores.type)} {m.course_scores.average}</p>
                                                <p>標準差 {m.course_scores.std_dev}</p>
                                            </div>}
                                        </TableCell>
                                        <TableCell className="p-0">
                                            <Button variant="ghost" size='icon' asChild>
                                                <Link href={`/${lang}/courses/${m.raw_id}`}>
                                                    <ArrowRight />
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                    <div className="w-[min(100%,284px)] flex flex-col gap-4">
                        <ScrollArea className="hidden lg:flex">
                            <div className="space-y-2">
                                <ul className="m-0 list-none">
                                    {!missingSyllabus && <TOCNavItem href="#brief" label={dict.course.details.brief} />}
                                    {!missingSyllabus && <TOCNavItem href="#description" label={dict.course.details.description} />}
                                    {course?.prerequisites && <TOCNavItem href="#prerequesites" label={dict.course.details.prerequesites} />}
                                    {showTimetable && <TOCNavItem href="#timetable" label={dict.course.details.timetable} />}
                                    {course.course_scores && <TOCNavItem href="#scores" label={dict.course.details.scores} />}
                                    {reviews.length > 0 && <TOCNavItem href="#ptt" label={dict.course.details.ptt} />}
                                    <TOCNavItem href="#other" label={dict.course.details.related_courses} />
                                </ul>
                            </div>
                        </ScrollArea>
                        <div className="flex flex-col gap-1">
                            <h3 className="font-semibold text-base">{dict.course.details.remarks}</h3>
                            <p className="text-sm">{course.note ?? "-"}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                            <h3 className="font-semibold text-base">{dict.course.details.restrictions}</h3>
                            <p className="text-sm">{course.restrictions ?? "-"}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                            <h3 className="font-semibold text-base">{dict.course.details.compulsory}</h3>
                            <div className="flex flex-row gap-2 flex-wrap">
                                {course.compulsory_for?.map((m, index) => <Badge key={index} variant="outline">{getFormattedClassCode(m)}</Badge>)}
                                {course.compulsory_for?.length == 0 && <p>-</p>}
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <h3 className="font-semibold text-base">{dict.course.details.elective}</h3>
                            <div className="flex flex-row gap-2 flex-wrap">
                                {course.elective_for?.map((m, index) => <Badge key={index} variant="outline">{getFormattedClassCode(m)}</Badge>)}
                                {course.elective_for?.length == 0 && <p>-</p>}
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <h3 className="font-semibold text-base">{dict.course.details.first_specialization}</h3>
                            <div className="flex flex-row gap-2 flex-wrap">
                                {course.first_specialization?.map((m, index) => <Badge key={index} variant="outline">{m}</Badge>)}
                                {course.first_specialization?.length == 0 && <p>-</p>}
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <h3 className="font-semibold text-base">{dict.course.details.second_specialization}</h3>
                            <div className="flex flex-row gap-2 flex-wrap">
                                {course.second_specialization?.map((m, index) => <Badge key={index} variant="outline">{m}</Badge>)}
                                {course.second_specialization?.length == 0 && <p>-</p>}
                            </div>
                        </div>
                    </div>
                </div>
                <CommmentsSectionDynamic course={course as MinimalCourse} />
            </div>
        </div>
    </Fade>
}

export default CourseDetailContainer;