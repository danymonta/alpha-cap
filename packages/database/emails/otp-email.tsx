import {
	Body,
	Container,
	Head,
	Heading,
	Html,
	Preview,
	Section,
	Tailwind,
	Text,
} from "@react-email/components";
import Footer from "./components/Footer";

export function OTPEmail({
	email = "",
	code = "",
}: {
	email: string;
	code: string;
}) {
	return (
		<Html>
			<Head />
			<Preview>Il tuo codice di accesso ad Alpha Loom: {code}</Preview>
			<Tailwind>
				<Body className="mx-auto my-auto bg-gray-1 font-sans">
					<Container className="mx-auto my-10 max-w-[500px] rounded border border-solid border-gray-200 px-10 py-5">
						<Section className="mt-8">
							<Text className="m-0 text-center text-2xl font-bold text-[#780000]">
								Alpha Loom
							</Text>
						</Section>
						<Heading className="mx-0 my-7 p-0 text-center text-xl font-semibold text-black">
							Il tuo codice di accesso
						</Heading>
						<Text className="text-sm leading-6 text-black">
							Benvenuto in Alpha Loom!
						</Text>
						<Text className="text-sm leading-6 text-black">
							Usa questo codice per accedere al tuo account:
						</Text>
						<Section className="my-8 text-center">
							<div className="rounded-lg bg-gray-100 px-8 py-6">
								<Text className="m-0 text-3xl font-bold tracking-wider text-black">
									{code}
								</Text>
							</div>
						</Section>
						<Text className="text-sm leading-6 text-black">
							Il codice scade tra 10 minuti. Se non l'hai richiesto tu, puoi
							ignorare questa email.
						</Text>
						<Footer email={email} />
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
}
