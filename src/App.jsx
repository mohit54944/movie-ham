import React from 'react';
import Search from './components/Search';
import { useEffect,useState } from 'react';
import Spinner from './components/Spinner';
import MovieCard from './components/MovieCard';
import { useDebounce } from 'react-use'
import { updateSearchCount, getTrendingMovies } from './appwrite';


const API_BASE_URL = 'https://api.themoviedb.org/3';  //so we dont have to repeat it while accessing it in the code

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = { // when we call an API using fetch, the options object (api_options) tells the browser how to make the request, and what kind of data or metadata to send to the API server.
  method: 'GET',  //I want to fetch data
  headers: { 
    accept: 'application/json',  //"Hey server, this is the type of data I want back in your response."
    Authorization : `Bearer ${API_KEY}`  //this is my api key
  }
}

const App = () => {
  const [searchTerm, setSearchTerm] = useState(''); 

  const [errorMessage, setErrorMessage] = useState('');

  const [movieList, setMovieList] = useState([]);

  const [trendingMovies, setTrendingMovies] = useState([]);

  const [isloading, setIsloading] = useState(false);

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(''); 

  useDebounce(() => setDebouncedSearchTerm(searchTerm), 500, [searchTerm]);

  const fetchMovies = async (query = '') => {

    setIsloading(true);
    setErrorMessage('');
    try {
      const endpoint = query 
        ?  `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
        :  `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;

      const response = await fetch(endpoint, API_OPTIONS);
      
      if(!response.ok) {
        throw new Error('failed to fetch movies');
      }

      const data = await response.json();
      
      if(data.response === 'false') {
        setErrorMessage(data.Error || 'failed to fetch movies');
        setMovieList([]);
        return;
      }

      setMovieList(data.results || []);

      if(query && data.results.length > 0) {
        await updateSearchCount(query,data.results[0]);
      } 

      
    } catch (error) {
      console.error(`Error fetching movies: ${error}`);
      setErrorMessage('Error fetching movies. Please try again later.');
    } finally {
      setIsloading(false);
    }
  }

  const loadTrendingMovies = async () => {

    try{
      const movies = await getTrendingMovies();

      setTrendingMovies(movies);

    } catch(error) {
      console.error(`Error fetching movies: ${error}`);
    }

  }


  useEffect(() => {
    fetchMovies(debouncedSearchTerm);
  }, [debouncedSearchTerm]);
  
  useEffect(() => {
    loadTrendingMovies();
  }, [])
  


  return (
    <main>
      <div className="pattern"/>
      <div className="wrapper">
        
        <header>
          <img src="./hero.png" alt="Hero Banner"/>
          <h1>Find <span className="text-gradient">Movies</span> You'll Enjoy Without Hassle</h1>
          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm}/>
        </header>

        { trendingMovies.length > 0 && (
        <section className='trending'>
          <h2>Trending Movies</h2>
          <ul>
            {trendingMovies.map((movie, index) => (
              <li key={movie.$id}>
                <p>{index+1}</p>
                <img src={movie.poster_url} alt={movie.title}/>
              </li>
            ))}
          </ul>
        </section>
        )}
        <section className="all-movies">
          <h2 >All Movies</h2>

          {isloading ? (
            <Spinner/>
          ) : errorMessage ? (
            <p className="text-red-500">{errorMessage}</p>
          ) : (
            <ul>
              {movieList.map((movie) => (
                <MovieCard key={movie.id} movie={movie}/>
              ))}
            </ul>
          )
          }
        </section>
      </div>
    </main> 
  )
}

export default App