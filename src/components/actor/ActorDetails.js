import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchPersonDetails } from "../../services/tmdb";
import { formatDate, calculateAge } from "../../utils/helpers";

const ActorDetails = () => {
	const { actorId } = useParams();
	const [actor, setActor] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [currentImageIndex, setCurrentImageIndex] = useState(0);
	const navigate = useNavigate();

	useEffect(() => {
		const loadActorDetails = async () => {
			try {
				const data = await fetchPersonDetails(actorId);
				setActor(data);
			} catch (err) {
				setError("Failed to load actor details.");
			} finally {
				setLoading(false);
			}
		};

		loadActorDetails();
	}, [actorId]);

	if (loading) return <p>Loading actor details...</p>;
	if (error) return <p style={{ color: "red" }}>Error: {error}</p>;
	if (!actor) return <p>No actor details available.</p>;

	let nationality = "Unknown";
	if (actor.place_of_birth) {
		const parts = actor.place_of_birth.split(", ");
		nationality = parts[parts.length - 1];
	}

	const images = actor.images?.profiles || [];
	const hasImages = images.length > 0;

	const nextImage = () => {
		setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
	};

	const prevImage = () => {
		setCurrentImageIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
	};

	return (
		<div style={{ padding: "20px" }}>
			<h1>{actor.name}</h1>

			{/* Ensure actor exists before rendering button */}
			{actor && (
				<button onClick={() => navigate(`/actor-connections/${actorId}`)}>
					View Actor Connections
				</button>
			)}

			<div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
				<button onClick={prevImage} disabled={!hasImages}>&lt;</button>

				<img
					src={
						hasImages
							? `https://image.tmdb.org/t/p/w500${images[currentImageIndex].file_path}`
							: actor.profile_path
								? `https://image.tmdb.org/t/p/w500${actor.profile_path}`
								: "https://via.placeholder.com/500x750?text=No+Image"
					}
					alt={actor.name}
					style={{ width: "300px", height: "auto", objectFit: "cover" }}
				/>

				<button onClick={nextImage} disabled={!hasImages}>&gt;</button>
			</div>

			<p><strong>Birthday:</strong> {actor.birthday ? formatDate(actor.birthday, "ddth Mon YYYY") : "Unknown"}</p>
			{actor.deathday && <p><strong>Died:</strong> {formatDate(actor.deathday, "dd Mon YYYY")}</p>}
			<p><strong>Age:</strong> {actor.birthday ? calculateAge(actor.birthday, new Date().toISOString().split("T")[0]) : "Unknown"}</p>
			<p><strong>Nationality:</strong> {nationality}</p>
			<p><strong>Gender:</strong> {actor.gender === 1 ? "Female" : actor.gender === 2 ? "Male" : "Non-Binary"}</p>
			<p><strong>Known For:</strong> {actor.known_for_department || "Unknown"}</p>
			<p><strong>Popularity:</strong> {actor.popularity || "Unknown"}</p>
			<p>
				<strong>IMDb Profile:</strong>{" "}
				<a href={`https://www.imdb.com/name/${actor.imdb_id}`} target="_blank" rel="noopener noreferrer">
					IMDb Link
				</a>
			</p>

			<h2>Biography</h2>
			<p>{actor.biography || "No biography available."}</p>

			<h2>Filmography</h2>
			<h2>Movies</h2>

			<h2>Known For</h2>
			{actor.movie_credits?.cast?.length > 0 ? (
				<div className="known-for-container">
					{Object.values(
						actor.movie_credits.cast
							.filter(movie => movie.poster_path) // Ensure the movie has a poster
							.sort((a, b) => b.popularity - a.popularity) // Sort by popularity
							.slice(0, 10) // Limit to 10 movies
							.reduce((acc, movie) => {
								if (!acc[movie.id]) {
									acc[movie.id] = {
										...movie,
										characters: [] // Create a new array to store all characters
									};
								}
								acc[movie.id].characters.push(movie.character); // Collect all character names
								return acc;
							}, {})
					).map(movie => (
						<div key={movie.id} className="known-for-item">
							<img
								src={`https://image.tmdb.org/t/p/w185${movie.poster_path}`}
								alt={movie.title}
								className="known-for-poster"
							/>
							<p><strong>{movie.title}</strong> ({new Date(movie.release_date).getFullYear()})</p>
							<p><strong>Characters:</strong> {movie.characters.join(", ")}</p>
						</div>
					))}
				</div>
			) : (
				<p>No known movies available.</p>
			)}


			<h3>TV Shows</h3>
			{actor.tv_credits?.cast?.length > 0 ? (
				<ul>
					{Object.values(
						actor.tv_credits.cast
							.filter(show => show.first_air_date) // Ensure the TV show has a valid release date
							.sort((a, b) => new Date(b.first_air_date) - new Date(a.first_air_date)) // Sort by release date
							.slice(0, 10) // Limit to 10 TV shows
							.reduce((acc, show) => {
								if (!acc[show.id]) {
									acc[show.id] = {
										...show,
										characters: [] // Create an array for character names
									};
								}
								acc[show.id].characters.push(show.character);
								return acc;
							}, {})
					).map(show => (
						<li key={show.id}>
							<img
								src={`https://image.tmdb.org/t/p/w185${show.poster_path}`}
								alt={show.name}
								className="known-for-poster"
							/>
							<p><strong>{show.name}</strong> ({new Date(show.first_air_date).getFullYear()})</p>
							<p><strong>Characters:</strong> {show.characters.join(", ")}</p>
						</li>
					))}
				</ul>
			) : (
				<p>No TV show credits available.</p>
			)}

		</div>
	);
};

export default ActorDetails;
