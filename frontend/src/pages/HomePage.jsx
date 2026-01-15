import CategoryItem from "../components/CategoryItem";
import HomePageBanner from "../components/HomePageBanner";

const logoBgUrl = "/logo_shadow.jpeg";

const categories = [
	{ href: "/fans", name: "Fans", imageUrl: "/ffans.jpeg" },
	{ href: "/switches-and-sockets", name: "Switches and sockets", imageUrl: "/switches.jpeg" },
	{ href: "/ledlights", name: "Led Lights", imageUrl: "/bulbs.jpeg" },
	{ href: "/wires", name: "Wires", imageUrl: "/wires.jpeg" },
];

const HomePage = () => {
	return (
		<div className='relative min-h-screen text-white overflow-hidden'>
			<img src={logoBgUrl} alt="" className="w-full h-[25rem] lg:h-[32rem] object-fit lg:object-cover" />
			<div className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16'>
				<h1 className='text-center text-5xl sm:text-6xl font-bold text-emerald-400 mb-4'>
					Explore Our Categories
				</h1>
				<p className='text-center text-xl text-gray-300 mb-12'>
					Discover the latest trends in eco-friendly fashion
				</p>

				<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
					{categories?.map((category) => (
						<CategoryItem category={category} key={category.name} />
					))}
				</div>

			</div>
			<div className="max-w-7xl mx-auto">
				<HomePageBanner />
			</div>
		</div>
	);
};
export default HomePage;
