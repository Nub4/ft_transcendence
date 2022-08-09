# ft_transcendence (Last project from 42 common core)

You need to add ```.env``` file to same directory where ```docker-compose.yml``` file is :

```
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_DB=
DB_HOST=
CLIENT_ID=
CLIENT_SECRET=
JWT_SECRET=
DATABASE_URL=
PORT=3000
NODE_ENV=production
PG_DATA=/var/lib/postgresql/data
CHOKIDAR_USEPOLLING=true
WDS_SOCKET_PORT=0
```
And another ```.env``` file to root of frontend directory, where REACT_APP_HOST variable is same as DB_HOST :

```
REACT_APP_HOST=
```
In the same directory to launch, Use the command :

```
docker-compose up
```

When database, backend and frontend are compiled successfully, go to website HOST:PORT. Ft_transcendence project works with Intra42 login, so after clicking "Signin", it redirects you to Intra42 login page. After singing in Intra, you will get access to website and will be redirected to profile page.

If you want to see database, take a new terminal window and use next commands :
```
docker container ls (to see list of docker containers)
docker exec -it <first_3_charachters_from_postgrescontainer_id> /bin/bash
(now you are inside container)
psql <database> <user>;
\c <database>; (connecting to database)
\dt (to see all the tables from database)
SELECT * FROM public.<table_name>; (to see data from that table)
```

### Second factor authentication with Google Authenticator

(TFA stands for two factor authentication)

Any user has the option to improve the security of their account by turning on second factor authentication.

First of all, we need to generate a secret that will be used to make one-time passwords.

This QR code needs to be scanned in the Google Authenticator app to store the secret on your phone.
