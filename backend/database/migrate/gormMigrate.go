package migrate

import(
	"backend/database/db"
)

func Migrate(){
	db.DBConnect()

}