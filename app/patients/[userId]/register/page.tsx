import RegisterForm from "@/components/forms/RegisterForm";
import { getPatient, getUser } from "@/lib/actions/patient.action";
import Image from "next/image";
import { redirect } from "next/navigation";
import * as Sentry from "@sentry/nextjs";

interface SearchParamProps {
  params: { userId: string };
}

const Register = async ({ params: { userId } }: SearchParamProps) => {
  const user = await getUser(userId);
  const patient = await getPatient(userId);

  if (patient) redirect(`/patients/${userId}/new-appointment`);
  console.log("User:", user);
  if (!user) redirect("/error");

  // Transform user to a serializable plain object
  const serializableUser = {
    $id: user.$id,
    name: user.name,
    email: user.email,
    phone: user.phone,
  };

  Sentry.captureMessage(`User viewed register page: ${user?.name}`);

  return (
    <div className="flex h-screen max-h-screen">
      <section className="remove-scrollbar container">
        <div className="sub-container max-w-[860px] flex-1 flex-col py-10">
          <Image
            src="/assets/icons/logo-full.svg"
            height={1000}
            width={1000}
            alt="patient"
            className="mb-12 h-10 w-fit"
          />

          <RegisterForm user={serializableUser} />

          <p className="copyright py-12">© 2025 CarePulse</p>
        </div>
      </section>

      <Image
        src="/assets/images/register-img.png"
        height={1000}
        width={1000}
        alt="patient"
        className="side-img max-w-[390px]"
      />
    </div>
  );
};

export default Register;