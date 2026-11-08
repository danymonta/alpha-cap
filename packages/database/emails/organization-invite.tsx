import {
	Body,
	Container,
	Head,
	Heading,
	Html,
	Link,
	Preview,
	Section,
	Tailwind,
	Text,
} from "@react-email/components";
import Footer from "./components/Footer";

export function OrganizationInvite({
	email = "",
	url = "",
	organizationName = "",
}: {
	email: string;
	url: string;
	organizationName: string;
}) {
	return (
		<Html>
			<Head />
			<Preview>Invito a entrare in {organizationName} su Alpha Loom</Preview>
			<Tailwind>
				<Body className="mx-auto my-auto bg-gray-1 font-sans">
					<Container className="mx-auto my-10 max-w-[500px] rounded border border-solid border-gray-200 px-10 py-5">
						<Section className="mt-8">
							<Text className="m-0 text-center text-2xl font-bold text-[#780000]">
								Alpha Loom
							</Text>
						</Section>
						<Heading className="mx-0 my-7 p-0 text-center text-xl font-semibold text-black">
							Sei stato invitato in {organizationName}
						</Heading>
						<Text className="text-sm leading-6 text-black">Ciao,</Text>
						<Text className="text-sm leading-6 text-black">
							sei stato invitato a entrare in {organizationName} su Alpha Loom.
							Clicca il pulsante qui sotto per accettare l'invito.
						</Text>
						<Section className="my-8 text-center">
							<Link
								className="rounded-full bg-black px-6 py-3 text-center text-[12px] font-semibold text-white no-underline"
								href={url}
							>
								Accetta invito
							</Link>
						</Section>
						<Text className="text-sm leading-6 text-black">
							oppure copia e incolla questo indirizzo nel browser:
						</Text>
						<Text className="max-w-sm flex-wrap break-words font-medium text-[#780000] no-underline">
							{url.replace(/^https?:\/\//, "")}
						</Text>
						<Footer email={email} />
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
}
